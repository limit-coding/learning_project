"""课程问答 API"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas.chat import CourseChatRequest, CourseChatResponse
from app.services.course_assistant import CourseAssistantService
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()
course_assistant = CourseAssistantService()


@router.post("/chat", response_model=CourseChatResponse)
async def course_chat(req: CourseChatRequest):
    """课程问答接口（非流式）"""
    course_context = course_assistant.build_answer_context(
        question=req.question,
        course_slug=req.course_slug,
        course_title=req.course_title,
    )
    answer = await llm_service.chat_with_search(
        question=req.question,
        course_context=course_context,
    )
    return CourseChatResponse(
        answer=answer,
        course_context=course_context[:500] if len(course_context) > 500 else course_context,
        search_used=True,
    )


@router.post("/chat/stream")
async def course_chat_stream(req: CourseChatRequest):
    """课程问答流式接口（SSE）"""
    course_context = course_assistant.build_answer_context(
        question=req.question,
        course_slug=req.course_slug,
        course_title=req.course_title,
    )
    return StreamingResponse(
        llm_service.stream_chat(
            question=req.question,
            course_context=course_context,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
