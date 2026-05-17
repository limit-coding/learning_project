#!/usr/bin/env python3
"""Enrich course-guide JSON files for denser frontend display."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]

STOP_WORDS = {
    "本章",
    "核心",
    "基础",
    "原理",
    "方法",
    "系统",
    "应用",
    "实验",
    "课程",
    "重点",
    "相关",
    "主要",
    "包括",
    "以及",
    "进行",
    "掌握",
    "理解",
    "能够",
}


def clean_chapter_title(title: str) -> str:
    return re.sub(r"^第\s*\d+\s*章[：:]\s*", "", title).strip()


def split_focus_terms(text: str) -> list[str]:
    text = re.sub(r"[A-Za-z_]+\([^)]*\)", "", text)
    text = re.sub(r"[，。；;：:、/（）()\[\]【】]", "|", text)
    raw_terms = [item.strip() for item in text.split("|")]
    terms: list[str] = []
    for item in raw_terms:
        if not item or len(item) < 2:
            continue
        item = re.sub(r"^(重点|讲解|介绍|覆盖|围绕|结合|理解|掌握|熟悉|能够)", "", item).strip()
        item = re.sub(r"(等|相关知识|核心内容|基本内容)$", "", item).strip()
        if not item or item in STOP_WORDS or len(item) > 18:
            continue
        if item not in terms:
            terms.append(item)
    return terms


def unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = re.sub(r"\s+", " ", item).strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def generated_checklist(course_title: str, chapter_title: str, focus: str) -> list[str]:
    terms = split_focus_terms(focus)
    title = clean_chapter_title(chapter_title)
    items: list[str] = []

    if terms:
        items.append(f"能说清{terms[0]}的定义、作用和适用场景")
    if len(terms) > 1:
        items.append(f"能把{terms[1]}与本章其他知识点建立联系")
    if len(terms) > 2:
        items.append(f"能围绕{terms[2]}完成典型题或实验步骤分析")
    if len(terms) > 3:
        items.append(f"能区分{terms[3]}相关的易混概念和常见误区")

    items.extend(
        [
            f"能用一张图梳理“{title}”的知识结构",
            f"能说明本章内容在{course_title}后续章节中的作用",
            "能整理本章公式、流程、参数或工具的使用条件",
            "能根据题目或实验现象判断应该调用哪些知识点",
        ]
    )
    return unique(items)


def enrich_chapters(course: dict[str, Any]) -> None:
    course_title = str(course.get("title", "本课程"))
    for chapter in course.get("chapters", []):
        if not isinstance(chapter, dict):
            continue
        title = str(chapter.get("title", "本章"))
        focus = str(chapter.get("focus", ""))
        checklist = [str(item) for item in chapter.get("checklist", []) if str(item).strip()]
        needed = generated_checklist(course_title, title, focus)
        chapter["checklist"] = unique(checklist + needed)[:7]


def branch_from_chapter(chapter: dict[str, Any]) -> dict[str, Any]:
    title = clean_chapter_title(str(chapter.get("title", "章节重点")))
    checklist = [str(item) for item in chapter.get("checklist", [])]
    focus_terms = split_focus_terms(str(chapter.get("focus", "")))
    children: list[str] = []
    for item in checklist[:4]:
        item = re.sub(r"^(能|能够|掌握|理解|熟悉|区分|说明|完成)", "", item).strip()
        item = re.sub(r"的定义、作用和适用场景$", "", item)
        item = re.sub(r"相关的易混概念和常见误区$", "易混点", item)
        if 2 <= len(item) <= 24:
            children.append(item)
    children.extend(focus_terms[:4])
    return {"title": title, "children": unique(children)[:6] or ["核心概念", "典型题型", "实验应用"]}


def enrich_mind_map(course: dict[str, Any]) -> None:
    existing = course.get("mindMap", [])
    branches: list[dict[str, Any]] = []
    if isinstance(existing, list):
        for branch in existing:
            if not isinstance(branch, dict):
                continue
            title = str(branch.get("title", "")).strip()
            children = [str(child).strip() for child in branch.get("children", []) if str(child).strip()]
            if title and children:
                branches.append({"title": title, "children": unique(children)[:6]})

    chapter_branches = [branch_from_chapter(chapter) for chapter in course.get("chapters", []) if isinstance(chapter, dict)]
    by_title: dict[str, dict[str, Any]] = {}
    for branch in branches + chapter_branches:
        if branch["title"] not in by_title:
            by_title[branch["title"]] = branch

    course["mindMap"] = list(by_title.values())[:8]


def enrich_route(course: dict[str, Any]) -> None:
    chapters = [clean_chapter_title(str(chapter.get("title", ""))) for chapter in course.get("chapters", []) if isinstance(chapter, dict)]
    current = [str(item) for item in course.get("route", []) if str(item).strip()]
    course["route"] = unique(current + chapters)[:9]


def enrich_study_summary(course: dict[str, Any]) -> None:
    chapters = [chapter for chapter in course.get("chapters", []) if isinstance(chapter, dict)]
    terms: list[str] = []
    mistakes: list[str] = []
    for chapter in chapters:
        terms.extend(split_focus_terms(str(chapter.get("focus", "")))[:2])
        title = clean_chapter_title(str(chapter.get("title", "")))
        if title:
            mistakes.append(f"{title}中的条件、公式和适用场景")

    course["studySummary"] = [
        {"title": "核心概念", "points": unique(terms)[:5]},
        {
            "title": "题型抓手",
            "points": [
                "按章节路线先建立概念框架，再补公式和流程",
                "每章至少保留一类典型题或实验场景",
                "遇到综合题时先判断所属模块，再列条件和约束",
                "复习时把图谱节点和章节 checklist 对照检查",
            ],
        },
        {"title": "易混点", "points": unique(mistakes)[:5]},
    ]


def enrich_one(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    enrich_chapters(data)
    enrich_mind_map(data)
    enrich_route(data)
    enrich_study_summary(data)
    data["reviewNotes"] = unique(
        [str(item) for item in data.get("reviewNotes", [])]
        + [
            "已按验收展示需求补充章节 checklist 和知识图谱密度，具体考试范围仍建议按老师课件确认。",
        ]
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return data


def discover(path: Path) -> list[Path]:
    if path.is_file():
        return [path]
    return sorted(path.rglob("course_guide.json"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich course-guide JSON files.")
    parser.add_argument("path", type=Path, help="course_guide.json or semester directory")
    parser.add_argument("--sync-outputs", action="store_true", help="Also update matching outputs/*.from_chapters.json files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    paths = discover(args.path)
    if not paths:
        print(f"未发现 course_guide.json: {args.path}")
        return 0

    enriched: list[dict[str, Any]] = []
    for path in paths:
        data = enrich_one(path)
        enriched.append(data)
        print(f"[OK] {data.get('title')} chapters={len(data.get('chapters', []))} mindMap={len(data.get('mindMap', []))}")

        if args.sync_outputs:
            output = ROOT / "outputs" / f"{data.get('title')}.from_chapters.json"
            if output.exists():
                output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"增密完成：{len(enriched)} 门课。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
