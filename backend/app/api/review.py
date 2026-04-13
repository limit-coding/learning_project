from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Resource, ReviewLog
from app.schemas.review import ReviewAction, ReviewLogResponse

router = APIRouter()


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
