from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Resource, ResourceCourseMapping
from app.schemas.resource import ResourceCreate, ResourceResponse

router = APIRouter()


@router.get("/resources", response_model=List[ResourceResponse])
def get_resources(
    course_node_id: Optional[int] = Query(None, description="按课程节点筛选"),
    resource_type: Optional[str] = Query(None, description="按类型筛选"),
    status: Optional[str] = Query("approved", description="按状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取资源列表，支持分页和筛选"""
    query = db.query(Resource)

    if status:
        query = query.filter(Resource.status == status)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)

    if course_node_id:
        mapping_ids = (
            db.query(ResourceCourseMapping.resource_id)
            .filter(ResourceCourseMapping.course_node_id == course_node_id)
            .subquery()
        )
        query = query.filter(Resource.id.in_(mapping_ids))

    resources = query.offset(skip).limit(limit).all()

    result = []
    for r in resources:
        mappings = (
            db.query(ResourceCourseMapping)
            .filter(ResourceCourseMapping.resource_id == r.id)
            .all()
        )
        result.append(ResourceResponse(
            id=r.id,
            title=r.title,
            url=r.url,
            resource_type=r.resource_type,
            source=r.source,
            summary=r.summary,
            difficulty=r.difficulty,
            status=r.status,
            submitted_by=r.submitted_by,
            created_at=r.created_at,
            course_node_ids=[m.course_node_id for m in mappings],
        ))
    return result


@router.get("/resources/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """获取单个资源详情"""
    r = db.query(Resource).filter(Resource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="资源不存在")

    mappings = (
        db.query(ResourceCourseMapping)
        .filter(ResourceCourseMapping.resource_id == r.id)
        .all()
    )
    return ResourceResponse(
        id=r.id,
        title=r.title,
        url=r.url,
        resource_type=r.resource_type,
        source=r.source,
        summary=r.summary,
        difficulty=r.difficulty,
        status=r.status,
        submitted_by=r.submitted_by,
        created_at=r.created_at,
        course_node_ids=[m.course_node_id for m in mappings],
    )


@router.post("/resources/submit", response_model=ResourceResponse)
def submit_resource(data: ResourceCreate, db: Session = Depends(get_db)):
    """提交新资源"""
    resource = Resource(
        title=data.title,
        url=data.url,
        resource_type=data.resource_type,
        source=data.source,
        summary=data.summary,
        difficulty=data.difficulty,
        status="pending",
    )
    db.add(resource)
    db.flush()

    for node_id in data.course_node_ids:
        mapping = ResourceCourseMapping(
            resource_id=resource.id,
            course_node_id=node_id,
        )
        db.add(mapping)

    db.commit()
    db.refresh(resource)

    return ResourceResponse(
        id=resource.id,
        title=resource.title,
        url=resource.url,
        resource_type=resource.resource_type,
        source=resource.source,
        summary=resource.summary,
        difficulty=resource.difficulty,
        status=resource.status,
        submitted_by=resource.submitted_by,
        created_at=resource.created_at,
        course_node_ids=data.course_node_ids,
    )
