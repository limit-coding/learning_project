from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ResourceCreate(BaseModel):
    title: str = Field(..., max_length=300)
    url: Optional[str] = None
    resource_type: Optional[str] = None  # video, article, book, course, lab, tool
    source: Optional[str] = None
    summary: Optional[str] = None
    difficulty: Optional[str] = None
    course_node_ids: List[int] = Field(default=[], description="关联的课程节点ID")


class ResourceResponse(BaseModel):
    id: int
    title: str
    url: Optional[str] = None
    resource_type: Optional[str] = None
    source: Optional[str] = None
    summary: Optional[str] = None
    difficulty: Optional[str] = None
    status: str = "pending"
    submitted_by: Optional[str] = None
    created_at: datetime
    course_node_ids: List[int] = []

    class Config:
        from_attributes = True
