#!/usr/bin/env python3
"""Batch-check AI course JSON files before they are merged into the app."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]


@dataclass
class CheckResult:
    path: Path
    kind: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def parse_json(path: Path) -> tuple[Any | None, list[str]]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), []
    except json.JSONDecodeError as exc:
        text = path.read_text(encoding="utf-8", errors="replace")
        first_object = min([idx for idx in [text.find("{"), text.find("[")] if idx >= 0], default=-1)
        hint = ""
        if first_object > 0:
            hint = "；文件开头疑似混入了非 JSON 说明文字"
        return None, [f"JSON 解析失败: {exc}{hint}"]


def get_path(data: dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def normalize_course(data: dict[str, Any]) -> dict[str, Any]:
    course = data.get("course")
    if isinstance(course, dict):
        return {
            "code": course.get("code"),
            "slug": course.get("slug"),
            "title": course.get("title"),
        }

    course_info = data.get("courseInfo")
    if isinstance(course_info, dict):
        return {
            "code": course_info.get("courseCode") or course_info.get("code"),
            "slug": course_info.get("courseSlug") or course_info.get("slug"),
            "title": course_info.get("courseName") or course_info.get("title"),
        }

    metadata = data.get("metadata")
    if isinstance(metadata, dict):
        return {
            "code": metadata.get("courseCode") or metadata.get("code"),
            "slug": metadata.get("courseSlug") or metadata.get("slug"),
            "title": metadata.get("courseName") or metadata.get("title"),
        }

    return {
        "code": data.get("courseCode"),
        "slug": data.get("courseSlug"),
        "title": data.get("courseName"),
    }


def normalize_chapter(data: dict[str, Any]) -> dict[str, Any]:
    chapter = data.get("chapter")
    course_info = data.get("courseInfo") if isinstance(data.get("courseInfo"), dict) else {}
    if isinstance(chapter, dict):
        return {
            "chapterNo": chapter.get("chapterNo") or chapter.get("chapterNumber") or course_info.get("chapterNumber"),
            "title": chapter.get("title") or chapter.get("chapterTitle") or course_info.get("chapterTitle"),
            "summary": chapter.get("summary"),
            "learningGoal": chapter.get("learningGoal"),
            "estimatedDifficulty": chapter.get("estimatedDifficulty"),
        }

    chapter_info = data.get("chapterInfo")
    if isinstance(chapter_info, dict):
        return {
            "chapterNo": chapter_info.get("chapterNo") or chapter_info.get("chapterNumber"),
            "title": chapter_info.get("title") or chapter_info.get("chapterTitle"),
            "summary": chapter_info.get("summary"),
            "learningGoal": chapter_info.get("learningGoal"),
            "estimatedDifficulty": chapter_info.get("estimatedDifficulty"),
        }

    metadata = data.get("metadata")
    if isinstance(metadata, dict):
        return {
            "chapterNo": metadata.get("chapterNo") or metadata.get("chapterNumber"),
            "title": metadata.get("chapterTitle") or metadata.get("title"),
            "summary": metadata.get("summary"),
            "learningGoal": metadata.get("learningGoal"),
            "estimatedDifficulty": metadata.get("estimatedDifficulty"),
        }

    return {
        "chapterNo": data.get("chapterNo") or data.get("chapterNumber") or course_info.get("chapterNumber"),
        "title": data.get("chapterTitle") or data.get("title") or course_info.get("chapterTitle"),
        "summary": data.get("summary"),
        "learningGoal": data.get("learningGoal"),
        "estimatedDifficulty": data.get("estimatedDifficulty"),
    }


def validate_course_guide(data: dict[str, Any], strict: bool) -> tuple[list[str], list[str]]:
    required = {
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
    errors: list[str] = []
    warnings: list[str] = []
    missing = sorted(required - set(data))
    if missing:
        errors.append(f"整课 guide 缺少字段: {', '.join(missing)}")

    for key in ["route", "chapters", "mindMap", "studySummary", "outcomes", "resources", "publicMaterials"]:
        if key in data and not isinstance(data[key], list):
            errors.append(f"{key} 应为数组")

    if strict and not data.get("reviewNotes"):
        warnings.append("reviewNotes 为空，建议保留人工审核提示")

    return errors, warnings


def validate_chapter_json(data: dict[str, Any], strict: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    course = normalize_course(data)
    chapter = normalize_chapter(data)

    missing_course = [key for key in ["code", "slug", "title"] if not course.get(key)]
    missing_chapter_core = [key for key in ["chapterNo", "title"] if not chapter.get(key)]

    if missing_course:
        errors.append(f"无法识别课程元信息: {', '.join(missing_course)}")
    if missing_chapter_core:
        errors.append(f"无法识别章节元信息: {', '.join(missing_chapter_core)}")

    for key in ["keyPoints", "reviewNotes", "uncertainItems"]:
        if key in data and not isinstance(data[key], list):
            errors.append(f"{key} 应为数组")

    if "mindMap" in data and not isinstance(data["mindMap"], (list, dict)):
        errors.append("mindMap 应为数组或可转换对象")

    if strict:
        missing = []
        if not chapter.get("summary"):
            missing.append("chapter.summary")
        if not chapter.get("learningGoal"):
            missing.append("chapter.learningGoal")
        if not chapter.get("estimatedDifficulty"):
            missing.append("chapter.estimatedDifficulty")
        if "chapterChecklist" not in data:
            missing.append("chapterChecklist")
        if "reviewNotes" not in data:
            missing.append("reviewNotes")
        if "uncertainItems" not in data:
            missing.append("uncertainItems")
        if missing:
            warnings.append(f"非标准单章格式，汇总脚本会尽量补齐: {', '.join(missing)}")

    return errors, warnings


def classify(path: Path, data: Any) -> str:
    if path.parent.name == "schemas":
        return "schema"
    if path.name == "all_chapters.json" and isinstance(data, list):
        return "chapter-index"
    if isinstance(data, dict) and {"code", "slug", "chapters"}.issubset(data):
        return "course-guide"
    return "chapter-json"


def discover(paths: list[Path]) -> list[Path]:
    if not paths:
        paths = [ROOT]

    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(sorted(path.rglob("*.json")))
        elif path.suffix == ".json":
            files.append(path)

    return [
        file
        for file in files
        if ".git" not in file.parts and not file.name.startswith("example_")
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch validate course AI JSON files.")
    parser.add_argument("paths", nargs="*", type=Path, help="Files or directories; defaults to ai_material_pipeline")
    parser.add_argument("--strict", action="store_true", help="Warn about non-standard but convertible AI drafts")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    files = discover(args.paths)
    if not files:
        print("未发现 JSON 文件")
        return 0

    failed = 0
    warned = 0
    for path in files:
        data, errors = parse_json(path)
        if data is None:
            result = CheckResult(path, "unknown", errors=errors)
        else:
            kind = classify(path, data)
            if kind in {"schema", "chapter-index"}:
                result = CheckResult(path, kind)
            elif not isinstance(data, dict):
                result = CheckResult(path, kind, errors=["顶层必须是对象"])
            elif kind == "course-guide":
                result = CheckResult(path, kind, *validate_course_guide(data, args.strict))
            else:
                result = CheckResult(path, kind, *validate_chapter_json(data, args.strict))

        label = "OK"
        if result.errors:
            label = "FAIL"
            failed += 1
        elif result.warnings:
            label = "WARN"
            warned += 1

        display_path = result.path.relative_to(ROOT) if result.path.is_relative_to(ROOT) else result.path
        print(f"[{label:4}] {result.kind:12} {display_path}")
        for error in result.errors:
            print(f"  - {error}")
        for warning in result.warnings:
            print(f"  - {warning}")

    summary = f"校验完成：{len(files)} 个文件，{failed} 个失败，{warned} 个警告。"
    print(summary)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
