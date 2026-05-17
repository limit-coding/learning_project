"""课程问答相关的 Pydantic schema"""
from pydantic import BaseModel
from typing import Optional


class CourseChatRequest(BaseModel):
    """课程问答请求"""
    question: str
    course_slug: Optional[str] = None  # 可选，指定课程
    course_title: Optional[str] = None  # 可选，课程标题


class CourseChatResponse(BaseModel):
    """课程问答响应"""
    answer: str
    course_context: Optional[str] = None  # 用于调试
    search_used: bool = False
