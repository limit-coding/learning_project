"""课程问答 API"""
import json
import os
from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from app.schemas.chat import CourseChatRequest, CourseChatResponse
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

# 课程数据缓存
_course_data_cache: Optional[Dict[str, dict]] = None


def load_course_data() -> Dict[str, dict]:
    """加载所有课程数据"""
    global _course_data_cache
    if _course_data_cache is not None:
        return _course_data_cache

    courses = {}
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai_material_pipeline", "outputs")

    if not os.path.exists(output_dir):
        print(f"课程数据目录不存在: {output_dir}")
        return courses

    for filename in os.listdir(output_dir):
        if filename.endswith(".from_chapters.json"):
            filepath = os.path.join(output_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    slug = data.get("slug", "")
                    if slug:
                        courses[slug] = data
                    # 也用标题索引
                    title = data.get("title", "")
                    if title:
                        courses[title] = data
            except Exception as e:
                print(f"加载课程文件失败 {filename}: {e}")

    _course_data_cache = courses
    return courses


def format_course_context(course_data: dict) -> str:
    """格式化课程数据为上下文"""
    parts = []

    # 基本信息
    parts.append(f"课程：{course_data.get('title', '')}（{course_data.get('shortTitle', '')}）")
    parts.append(f"简介：{course_data.get('summary', '')}")

    # 学习路线
    route = course_data.get("route", [])
    if route:
        parts.append(f"学习路线：{' → '.join(route)}")

    # 章节详情
    chapters = course_data.get("chapters", [])
    if chapters:
        parts.append("\n章节内容：")
        for ch in chapters:
            parts.append(f"\n【{ch['title']}】")
            parts.append(f"重点：{ch.get('focus', '')}")
            checklist = ch.get("checklist", [])
            if checklist:
                parts.append("学习要求：" + "；".join(checklist))

    # 学习总结
    study_summary = course_data.get("studySummary", [])
    if study_summary:
        parts.append("\n学习要点：")
        for section in study_summary:
            parts.append(f"\n{section['title']}：")
            for point in section.get("points", []):
                parts.append(f"- {point}")

    # 考试重点
    review_notes = course_data.get("reviewNotes", [])
    if review_notes:
        parts.append("\n考试重点：")
        for note in review_notes:
            parts.append(f"- {note}")

    # 学习资源
    resources = course_data.get("resources", [])
    if resources:
        parts.append("\n推荐资源：")
        for res in resources:
            parts.append(f"- {res['title']}（{res['type']}）：{res.get('description', '')}")

    return "\n".join(parts)


@router.post("/chat", response_model=CourseChatResponse)
async def course_chat(req: CourseChatRequest):
    """课程问答接口"""
    courses = load_course_data()

    # 构建上下文
    context_parts = []

    # 如果指定了课程
    if req.course_slug:
        course = courses.get(req.course_slug)
        if not course:
            # 尝试用标题查找
            course = courses.get(req.course_slug)

        if course:
            context_parts.append(format_course_context(course))
        else:
            raise HTTPException(status_code=404, detail=f"课程不存在：{req.course_slug}")
    elif req.course_title:
        course = courses.get(req.course_title)
        if course:
            context_parts.append(format_course_context(course))
        else:
            # 模糊匹配
            for key, data in courses.items():
                if req.course_title in key or req.course_title in data.get("title", ""):
                    context_parts.append(format_course_context(data))
                    break
    else:
        # 没有指定课程，提供所有课程概览
        context_parts.append("可用课程列表：")
        seen = set()
        for key, data in courses.items():
            title = data.get("title", "")
            if title and title not in seen:
                seen.add(title)
                summary = data.get("summary", "")[:100]
                context_parts.append(f"- {title}：{summary}")

    course_context = "\n".join(context_parts)

    # 调用 LLM
    answer = await llm_service.chat_with_search(
        question=req.question,
        course_context=course_context,
    )

    return CourseChatResponse(
        answer=answer,
        course_context=course_context[:500] if len(course_context) > 500 else course_context,
        search_used=True,
    )
