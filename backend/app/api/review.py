from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Resource, ReviewLog
from app.schemas.review import ReviewAction, ReviewLogResponse
from app.core.deps import get_current_user
from app.models.models import User

router = APIRouter()


@router.get("/resources/pending")
def list_pending_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """管理员查看待审核资源列表"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可访问")
    resources = (
        db.query(Resource)
        .filter(Resource.status == "pending")
        .order_by(Resource.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "title": r.title,
            "url": r.url,
            "resource_type": r.resource_type,
            "summary": r.summary,
            "submitted_by": r.submitted_by,
            "created_at": r.created_at,
        }
        for r in resources
    ]


@router.post("/resources/{resource_id}/review")
def review_resource(
    resource_id: int,
    action: ReviewAction,
    db: Session = Depends(get_db),
):
    """审核资源：approve 或 reject"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")

    if action.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action 必须是 approve 或 reject")

    resource.status = "approved" if action.action == "approve" else "rejected"
    resource.reviewed_by = action.reviewer
    if action.summary:
        resource.summary = action.summary
    if action.resource_type:
        resource.resource_type = action.resource_type

    log = ReviewLog(
        resource_id=resource_id,
        reviewer=action.reviewer,
        action=action.action,
        comment=action.comment,
    )
    db.add(log)
    db.commit()

    return {
        "id": resource.id,
        "status": resource.status,
        "reviewed_by": resource.reviewed_by,
    }


@router.get("/resources/{resource_id}/reviews", response_model=List[ReviewLogResponse])
def get_review_logs(resource_id: int, db: Session = Depends(get_db)):
    """获取资源的审核记录"""
    logs = db.query(ReviewLog).filter(ReviewLog.resource_id == resource_id).all()
    return logs
