#!/usr/bin/env python3
"""Validate chapter JSON files produced by web AI tools."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INBOX = ROOT / "chapter_json_inbox"

REQUIRED_TOP_LEVEL = {
    "course",
    "chapter",
    "mindMap",
    "keyPoints",
    "chapterChecklist",
    "reviewNotes",
    "uncertainItems",
}

REQUIRED_COURSE = {"code", "slug", "title"}
REQUIRED_CHAPTER = {"chapterNo", "title", "summary", "learningGoal", "estimatedDifficulty"}


def validate_one(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"JSON 解析失败: {exc}"]

    missing = sorted(REQUIRED_TOP_LEVEL - set(data.keys()))
    if missing:
        errors.append(f"缺少顶层字段: {', '.join(missing)}")

    course = data.get("course", {})
    if not isinstance(course, dict):
        errors.append("course 应为对象")
    else:
        missing_course = sorted(REQUIRED_COURSE - set(course.keys()))
        if missing_course:
            errors.append(f"course 缺少字段: {', '.join(missing_course)}")

    chapter = data.get("chapter", {})
    if not isinstance(chapter, dict):
        errors.append("chapter 应为对象")
    else:
        missing_chapter = sorted(REQUIRED_CHAPTER - set(chapter.keys()))
        if missing_chapter:
            errors.append(f"chapter 缺少字段: {', '.join(missing_chapter)}")

    for key in ["mindMap", "keyPoints", "chapterChecklist", "reviewNotes", "uncertainItems"]:
        if key in data and not isinstance(data[key], list):
            errors.append(f"{key} 应为数组")

    for branch in data.get("mindMap", []):
        if not isinstance(branch, dict):
            errors.append("mindMap 中存在非对象元素")
            continue
        if "title" not in branch or "children" not in branch:
            errors.append("mindMap 节点必须包含 title 和 children")

    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate chapter JSON inbox files.")
    parser.add_argument("--inbox", type=Path, default=DEFAULT_INBOX)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    paths = sorted(p for p in args.inbox.glob("*.json") if not p.name.startswith("example_"))
    if not paths:
        print(f"未发现待校验 JSON: {args.inbox}")
        return 0

    failed = 0
    for path in paths:
        errors = validate_one(path)
        if errors:
            failed += 1
            print(f"[FAIL] {path.name}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"[ OK ] {path.name}")

    if failed:
        print(f"校验完成：{failed} 个文件存在问题。")
        return 1

    print("校验完成：全部通过。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

