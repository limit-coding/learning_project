from pydantic import BaseModel, Field
from typing import Optional


class ReviewAction(BaseModel):
    action: str = Field(..., description="approve 或 reject")
    reviewer: str = Field(default="admin", description="审核人")
    comment: Optional[str] = None
    # 审核时可以补充/修正这些字段
    summary: Optional[str] = None
    resource_type: Optional[str] = None


class ReviewLogResponse(BaseModel):
    id: int
    resource_id: int
    reviewer: str
    action: str
    comment: Optional[str] = None

    class Config:
        from_attributes = True
