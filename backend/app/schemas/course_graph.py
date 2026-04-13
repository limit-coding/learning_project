from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CourseNodeResponse(BaseModel):
    id: int
    title: str
    slug: str
    summary: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    is_active: int = 1

    class Config:
        from_attributes = True


class CourseNodeDetail(CourseNodeResponse):
    """节点详情 + 关联资源"""
    resources: List["ResourceBrief"] = []
    prerequisites: List[CourseNodeResponse] = []
    dependents: List[CourseNodeResponse] = []


class CourseEdgeResponse(BaseModel):
    id: int
    source_node_id: int
    target_node_id: int
    relation_type: str = "prerequisite"

    class Config:
        from_attributes = True


class ResourceBrief(BaseModel):
    id: int
    title: str
    url: Optional[str] = None
    resource_type: Optional[str] = None

    class Config:
        from_attributes = True


# 解决前向引用
CourseNodeDetail.model_rebuild()
