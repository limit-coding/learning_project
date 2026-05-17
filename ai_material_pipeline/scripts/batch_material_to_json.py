#!/usr/bin/env python3
"""Batch-run material_to_json.py for all raw course material files."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import material_to_json as single


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "raw_materials"
OUTPUT_DIR = ROOT / "outputs"

INPUT_ALIASES = {
    "bupt_communication_principles": ["communication_principles", "example_communication_principles"],
    "bupt_computer_organization": ["computer_organization", "computer_principles"],
    "bupt_deep_learning_pytorch": ["deep_learning_pytorch", "deep_learning"],
    "bupt_discrete_math": ["discrete_math"],
    "bupt_programming_practice": ["programming_practice"],
}


def find_input(course: str, input_dir: Path) -> Path | None:
    stems = [course, *INPUT_ALIASES.get(course, [])]
    for stem in stems:
        for suffix in [".md", ".txt"]:
            path = input_dir / f"{stem}{suffix}"
            if path.exists():
                return path
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch convert raw course materials into guide JSON drafts.")
    parser.add_argument("--input-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--only", nargs="*", choices=sorted(single.COURSE_META.keys()), help="Optional course slug allow-list")
    parser.add_argument("--api-base", default=os.environ.get("XIAOMI_API_BASE", "https://token-plan-sgp.xiaomimimo.com/v1"))
    parser.add_argument("--model", default=os.environ.get("XIAOMI_MODEL", ""))
    parser.add_argument("--api-key-env", default="XIAOMI_API_KEY")
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--mock", action="store_true", help="Generate local mock JSON without calling API")
    return parser.parse_args()


def main() -> int:
    single.load_dotenv(ROOT / ".env")
    args = parse_args()
    courses = args.only or sorted(single.COURSE_META.keys())

    api_key = os.environ.get(args.api_key_env, "").strip()
    if not args.mock and (not api_key or not args.model):
        print(f"缺少 API 配置：{args.api_key_env} 或 XIAOMI_MODEL。可先加 --mock 检查流程。")
        return 2

    failed = 0
    generated = 0
    for course in courses:
        input_path = find_input(course, args.input_dir)
        if not input_path:
            print(f"[SKIP] {course}: 未找到 raw material")
            continue

        material = input_path.read_text(encoding="utf-8")
        if args.mock:
            draft = single.mock_draft(course, material)
        else:
            content = single.call_chat_completion(
                api_key=api_key,
                base_url=args.api_base,
                model=args.model,
                messages=single.build_messages(course, material),
                temperature=args.temperature,
            )
            draft = single.extract_json(content)

        errors = single.validate_draft(draft)
        output = args.output_dir / f"{course}.draft.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        if errors:
            failed += 1
            print(f"[FAIL] {course}: {output}")
            for error in errors:
                print(f"  - {error}")
        else:
            generated += 1
            print(f"[ OK ] {course}: {output}")

    print(f"批量生成完成：成功 {generated}，失败 {failed}。")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
