#!/usr/bin/env python3
"""Build a frontend-ready course guide draft from per-chapter AI JSON files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "outputs"

COURSE_META = {
    "BUPT_DM": {
        "code": "BUPT_DM",
        "slug": "bupt_discrete_math",
        "title": "离散数学",
        "shortTitle": "离散",
    },
    "BUPT_PRACTICE": {
        "code": "BUPT_PRACTICE",
        "slug": "bupt_programming_practice",
        "title": "程序设计基础实训",
        "shortTitle": "实训",
    },
    "BUPT_COA": {
        "code": "BUPT_COA",
        "slug": "bupt_computer_organization",
        "title": "计算机原理与组成（微机原理）",
        "shortTitle": "计组/微机",
    },
    "BUPT_COMM": {
        "code": "BUPT_COMM",
        "slug": "bupt_communication_principles",
        "title": "通信原理",
        "shortTitle": "通原",
    },
    "BUPT_DL": {
        "code": "BUPT_DL",
        "slug": "bupt_deep_learning_pytorch",
        "title": "深度学习（PyTorch）",
        "shortTitle": "深度学习",
    },
    "BUPT_DL_PyTorch": {
        "code": "BUPT_DL",
        "slug": "bupt_deep_learning_pytorch",
        "title": "深度学习（PyTorch）",
        "shortTitle": "深度学习",
    },
}

SLUG_ALIASES = {
    "bupt-deep-learning-pytorch": "bupt_deep_learning_pytorch",
    "discrete-mathematics": "bupt_discrete_math",
}


def load_json(path: Path) -> Any:
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        first_object = min([idx for idx in [text.find("{"), text.find("[")] if idx >= 0], default=-1)
        if first_object > 0:
            return json.loads(text[first_object:])
        raise


def first_present(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def normalize_slug(slug: str | None) -> str | None:
    if not slug:
        return None
    return SLUG_ALIASES.get(slug, slug)


def course_from_data(data: dict[str, Any]) -> dict[str, str]:
    course = data.get("course") if isinstance(data.get("course"), dict) else {}
    course_info = data.get("courseInfo") if isinstance(data.get("courseInfo"), dict) else {}
    metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}

    code = first_present(
        course.get("code"),
        course_info.get("courseCode"),
        course_info.get("code"),
        metadata.get("courseCode"),
        metadata.get("code"),
        data.get("courseCode"),
    )
    meta = COURSE_META.get(str(code), {})
    slug = normalize_slug(
        first_present(
            course.get("slug"),
            course_info.get("courseSlug"),
            course_info.get("slug"),
            metadata.get("courseSlug"),
            metadata.get("slug"),
            data.get("courseSlug"),
            meta.get("slug"),
        )
    )
    if not meta and slug:
        meta = next((item for item in COURSE_META.values() if item["slug"] == slug), {})
    code = first_present(meta.get("code"), code)
    slug = normalize_slug(first_present(slug, meta.get("slug")))
    title = first_present(
        meta.get("title"),
        course.get("title"),
        course_info.get("courseName"),
        course_info.get("title"),
        metadata.get("courseName"),
        metadata.get("title"),
        data.get("courseName"),
    )
    short_title = first_present(meta.get("shortTitle"), title)

    return {
        "code": str(code or ""),
        "slug": str(slug or ""),
        "title": str(title or ""),
        "shortTitle": str(short_title or ""),
    }


def chapter_from_data(data: dict[str, Any], fallback_path: Path) -> dict[str, str]:
    chapter = data.get("chapter") if isinstance(data.get("chapter"), dict) else {}
    chapter_info = data.get("chapterInfo") if isinstance(data.get("chapterInfo"), dict) else {}
    course_info = data.get("courseInfo") if isinstance(data.get("courseInfo"), dict) else {}
    metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}

    number = first_present(
        chapter.get("chapterNo"),
        chapter.get("chapterNumber"),
        chapter_info.get("chapterNo"),
        chapter_info.get("chapterNumber"),
        course_info.get("chapterNumber"),
        metadata.get("chapterNo"),
        metadata.get("chapterNumber"),
        data.get("chapterNo"),
        data.get("chapterNumber"),
    )
    title = first_present(
        chapter.get("title"),
        chapter.get("chapterTitle"),
        chapter_info.get("title"),
        chapter_info.get("chapterTitle"),
        course_info.get("chapterTitle"),
        metadata.get("chapterTitle"),
        metadata.get("title"),
        data.get("chapterTitle"),
        fallback_path.stem,
    )
    summary = first_present(chapter.get("summary"), chapter_info.get("summary"), metadata.get("summary"), data.get("summary"))
    learning_goal = first_present(
        chapter.get("learningGoal"),
        chapter_info.get("learningGoal"),
        metadata.get("learningGoal"),
        data.get("learningGoal"),
    )
    difficulty = first_present(
        chapter.get("estimatedDifficulty"),
        chapter_info.get("estimatedDifficulty"),
        metadata.get("estimatedDifficulty"),
        data.get("estimatedDifficulty"),
    )

    return {
        "chapterNo": str(number or fallback_path.stem),
        "title": str(title or fallback_path.stem),
        "summary": str(summary or ""),
        "learningGoal": str(learning_goal or ""),
        "estimatedDifficulty": str(difficulty or ""),
    }


def text_items(values: Any, limit: int = 6) -> list[str]:
    if not isinstance(values, list):
        return []
    items: list[str] = []
    for value in values:
        if isinstance(value, str):
            items.append(value)
        elif isinstance(value, dict):
            text = first_present(value.get("title"), value.get("topic"), value.get("description"), value.get("sectionTitle"))
            if text:
                items.append(str(text))
        if len(items) >= limit:
            break
    return items


def section_titles(data: dict[str, Any], limit: int = 6) -> list[str]:
    structure = data.get("knowledgeStructure")
    if not isinstance(structure, dict):
        return []
    sections = structure.get("sections")
    if not isinstance(sections, list):
        return []
    titles: list[str] = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        title = section.get("sectionTitle")
        if title:
            titles.append(str(title))
        if len(titles) >= limit:
            break
    return titles


def chapter_sort_key(path: Path, chapter: dict[str, str]) -> tuple[int, str]:
    candidates = [chapter.get("chapterNo", ""), path.stem]
    for candidate in candidates:
        match = re.search(r"\d+", candidate)
        if match:
            return int(match.group()), path.name
    return 999, path.name


def build_guide(input_dir: Path) -> dict[str, Any]:
    paths = [
        path
        for path in sorted(input_dir.glob("*.json"))
        if not path.name.startswith("example_") and path.name != "all_chapters.json"
    ]
    if not paths:
        raise RuntimeError(f"未发现章节 JSON: {input_dir}")

    records: list[tuple[Path, dict[str, Any], dict[str, str], dict[str, str]]] = []
    for path in paths:
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        course = course_from_data(data)
        chapter = chapter_from_data(data, path)
        records.append((path, data, course, chapter))

    if not records:
        raise RuntimeError(f"未发现可汇总的章节对象: {input_dir}")

    records.sort(key=lambda item: chapter_sort_key(item[0], item[3]))
    first_course = next(course for _, _, course, _ in records if course.get("code") or course.get("title"))

    chapters = []
    mind_map = []
    resources = []
    review_notes = []
    uncertain_items = []
    all_key_points: list[str] = []
    all_mistakes: list[str] = []

    for _, data, _, chapter in records:
        key_points = text_items(data.get("keyPoints"), limit=6)
        checklist = text_items(data.get("chapterChecklist"), limit=6)
        if not checklist:
            checklist = key_points[:5] or section_titles(data, limit=5)
        focus = chapter.get("summary") or chapter.get("learningGoal") or "、".join(key_points[:3]) or "待人工补充本章重点"

        chapter_label = chapter["chapterNo"]
        if not chapter_label.startswith("第"):
            chapter_label = f"第 {chapter_label} 章"
        chapters.append(
            {
                "title": f"{chapter_label}：{chapter['title']}",
                "focus": focus,
                "checklist": checklist or ["确认本章知识点", "确认考试/实验重点"],
            }
        )

        children = key_points[:5] or section_titles(data, limit=5) or checklist[:5]
        mind_map.append({"title": chapter["title"], "children": children or ["待补充知识点"]})

        all_key_points.extend(key_points)
        all_mistakes.extend(text_items(data.get("commonMistakes"), limit=3))
        review_notes.extend(text_items(data.get("reviewNotes"), limit=3))
        uncertain_items.extend(text_items(data.get("uncertainItems"), limit=3))
        resources.extend(text_items(data.get("suggestedResources"), limit=2))

    route = [chapter["title"].split("：")[-1] for chapter in chapters[:8]]
    core_points = unique_keep_order(all_key_points)[:6]
    mistakes = unique_keep_order(all_mistakes)[:6]
    review_notes = unique_keep_order(review_notes)
    uncertain_items = unique_keep_order(uncertain_items)

    guide = {
        **first_course,
        "summary": f"围绕{first_course['title']}的章节顺序，先抓主干概念，再用公式、题型和易错点做验收复习。",
        "route": route,
        "chapters": chapters,
        "mindMap": mind_map[:8],
        "studySummary": [
            {"title": "核心概念", "points": core_points[:4] or route[:4]},
            {"title": "题型抓手", "points": ["按章节 checklist 逐项自测", "优先复盘公式、例题和典型问答", "把章节间前后置关系串成路线"]},
            {"title": "易混点", "points": mistakes[:4] or uncertain_items[:4] or ["AI 生成内容需按课件和老师要求复核"]},
        ],
        "outcomes": ["形成章节路线图", "整理每章 checklist", "沉淀考试/实验复习重点"],
        "resources": [
            {"title": f"{first_course['shortTitle']}章节复习清单", "type": "清单", "description": "由已填充章节 JSON 自动汇总生成，适合验收前快速浏览。"},
            {"title": f"{first_course['shortTitle']}知识点索引", "type": "知识卡", "description": "按章节抽取 keyPoints 和知识结构，后续可继续人工精修。"},
        ],
        "publicMaterials": [],
        "reviewNotes": review_notes[:8] or uncertain_items[:8] or ["该文件由章节 JSON 自动汇总，建议验收前抽查章节顺序、标题和重点。"],
    }
    return guide


def unique_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = item.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a course guide JSON from chapter JSON files.")
    parser.add_argument("input_dir", type=Path, help="Directory containing per-chapter JSON files")
    parser.add_argument("--output", type=Path, help="Output JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    guide = build_guide(args.input_dir)
    output = args.output or OUTPUT_DIR / f"{guide['slug']}.from_chapters.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(guide, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"已生成: {output}")
    print(f"课程: {guide['title']}，章节数: {len(guide['chapters'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
