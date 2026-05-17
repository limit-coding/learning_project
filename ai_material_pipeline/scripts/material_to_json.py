#!/usr/bin/env python3
"""Convert course material notes into a structured course-guide JSON draft.

This script uses an OpenAI-compatible Chat Completions API. It is intended for
internal course-material production, not for end-user uploads.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROMPT_PATH = ROOT / "prompts" / "course_material_to_json.md"
OUTPUT_DIR = ROOT / "outputs"

COURSE_META = {
    "bupt_discrete_math": {
        "code": "BUPT_DM",
        "title": "离散数学",
        "shortTitle": "离散",
    },
    "bupt_programming_practice": {
        "code": "BUPT_PRACTICE",
        "title": "程序设计基础实训",
        "shortTitle": "实训",
    },
    "bupt_computer_organization": {
        "code": "BUPT_COA",
        "title": "计算机原理与组成（微机原理）",
        "shortTitle": "计组/微机",
    },
    "bupt_communication_principles": {
        "code": "BUPT_COMM",
        "title": "通信原理",
        "shortTitle": "通原",
    },
    "bupt_deep_learning_pytorch": {
        "code": "BUPT_DL",
        "title": "深度学习（PyTorch）",
        "shortTitle": "深度学习",
    },
}

REQUIRED_KEYS = {
    "code",
    "slug",
    "title",
    "shortTitle",
    "summary",
    "route",
    "chapters",
    "mindMap",
    "studySummary",
    "outcomes",
    "resources",
    "publicMaterials",
    "reviewNotes",
}


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def extract_json(text: str) -> dict[str, Any]:
    cleaned = strip_code_fence(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def validate_draft(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    missing = sorted(REQUIRED_KEYS - set(data.keys()))
    if missing:
        errors.append(f"缺少字段: {', '.join(missing)}")

    for key in [
        "route",
        "chapters",
        "mindMap",
        "studySummary",
        "outcomes",
        "resources",
        "publicMaterials",
        "reviewNotes",
    ]:
        if key in data and not isinstance(data[key], list):
            errors.append(f"{key} 应该是数组")

    for chapter in data.get("chapters", []):
        if not isinstance(chapter, dict):
            errors.append("chapters 中存在非对象元素")
            continue
        for key in ["title", "focus", "checklist"]:
            if key not in chapter:
                errors.append(f"章节缺少字段: {key}")

    for branch in data.get("mindMap", []):
        if not isinstance(branch, dict):
            errors.append("mindMap 中存在非对象元素")
            continue
        if "title" not in branch or "children" not in branch:
            errors.append("mindMap 节点必须包含 title 和 children")

    for section in data.get("studySummary", []):
        if not isinstance(section, dict):
            errors.append("studySummary 中存在非对象元素")
            continue
        if "title" not in section or "points" not in section:
            errors.append("studySummary 节点必须包含 title 和 points")

    return errors


def build_messages(course: str, material: str) -> list[dict[str, str]]:
    meta = COURSE_META[course]
    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    user_prompt = f"""课程元信息：
code: {meta["code"]}
slug: {course}
title: {meta["title"]}
shortTitle: {meta["shortTitle"]}

原始材料：
{material}
"""
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def call_chat_completion(
    *,
    api_key: str,
    base_url: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API HTTP {exc.code}: {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"API 请求失败: {exc}") from exc

    try:
        return result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"无法解析 API 响应: {json.dumps(result, ensure_ascii=False)[:1000]}") from exc


def mock_draft(course: str, material: str) -> dict[str, Any]:
    meta = COURSE_META[course]
    return {
        "code": meta["code"],
        "slug": course,
        "title": meta["title"],
        "shortTitle": meta["shortTitle"],
        "summary": "这是 mock 模式生成的结构化草稿，请用真实 API 重新生成。",
        "route": ["材料阅读", "章节拆解", "知识点归纳", "人工审核"],
        "chapters": [
            {
                "title": "第 1 章：待 AI 解析",
                "focus": material[:120] or "待补充材料",
                "checklist": ["确认教材目录", "确认老师重点", "确认实验要求"],
            }
        ],
        "mindMap": [{"title": "待审核知识模块", "children": ["教材目录", "课件标题", "考试重点"]}],
        "studySummary": [
            {"title": "核心概念", "points": ["待 AI 解析"]},
            {"title": "题型抓手", "points": ["待人工审核"]},
            {"title": "交付风险", "points": ["材料不足时内容偏保守"]},
        ],
        "outcomes": ["生成可审核 JSON 草稿"],
        "resources": [{"title": "原始材料整理卡", "type": "笔记", "description": "由同学提供材料后生成。"}],
        "publicMaterials": [],
        "reviewNotes": ["mock 模式仅用于检查脚本流程，不代表最终内容。"],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert course materials into course-guide JSON.")
    parser.add_argument("--course", required=True, choices=sorted(COURSE_META.keys()))
    parser.add_argument("--input", required=True, type=Path, help="Markdown/TXT material file")
    parser.add_argument("--output", type=Path, help="Output JSON path")
    parser.add_argument("--api-base", default=os.environ.get("XIAOMI_API_BASE", "https://token-plan-sgp.xiaomimimo.com/v1"))
    parser.add_argument("--model", default=os.environ.get("XIAOMI_MODEL", ""))
    parser.add_argument("--api-key-env", default="XIAOMI_API_KEY")
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--mock", action="store_true", help="Generate a local mock JSON without calling API")
    return parser.parse_args()


def main() -> int:
    load_dotenv(ROOT / ".env")
    args = parse_args()

    if not args.input.exists():
        print(f"输入文件不存在: {args.input}", file=sys.stderr)
        return 2

    material = args.input.read_text(encoding="utf-8")
    output_path = args.output or (OUTPUT_DIR / f"{args.course}.draft.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if args.mock:
        draft = mock_draft(args.course, material)
    else:
        api_key = os.environ.get(args.api_key_env, "").strip()
        if not api_key:
            print(f"缺少环境变量 {args.api_key_env}。请复制 .env.example 为 .env 后填写。", file=sys.stderr)
            return 2
        if not args.model:
            print("缺少 XIAOMI_MODEL。请在 .env 中填写模型名，或用 --model 指定。", file=sys.stderr)
            return 2

        content = call_chat_completion(
            api_key=api_key,
            base_url=args.api_base,
            model=args.model,
            messages=build_messages(args.course, material),
            temperature=args.temperature,
        )
        draft = extract_json(content)

    errors = validate_draft(draft)
    output_path.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"已生成: {output_path}")
    if errors:
        print("结构检查发现问题:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("结构检查通过。下一步请人工审核 reviewNotes、章节顺序和重点。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
