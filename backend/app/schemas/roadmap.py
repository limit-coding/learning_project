from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class RoadmapGenerateRequest(BaseModel):
    goal: str = Field(..., description="用户学习目标，自然语言描述")
    mastered_slugs: List[str] = Field(default=[], description="已掌握的课程 slug 列表")


class RoadmapNode(BaseModel):
    slug: str
    title: str
    summary: Optional[str] = None
    difficulty: Optional[str] = None
    is_mastered: bool = False


class RoadmapEdge(BaseModel):
    source: str  # slug
    target: str  # slug
    relation_type: str = "prerequisite"


class RoadmapResponse(BaseModel):
    id: int
    user_goal: str
    nodes: List[RoadmapNode]
    edges: List[RoadmapEdge]
    created_at: datetime

    class Config:
        from_attributes = True
