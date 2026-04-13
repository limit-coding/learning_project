from pydantic import BaseModel, Field
from typing import List, Optional


class SearchRequest(BaseModel):
    query: str = Field(..., description="搜索查询")
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    chunk_id: int
    resource_id: int
    resource_title: str
    content: str
    score: float


class ChatRetrieveRequest(BaseModel):
    question: str = Field(..., description="用户问题")


class ChatRetrieveResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
    has_enough_context: bool = True
