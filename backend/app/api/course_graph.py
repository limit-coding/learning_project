from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import CourseNode, CourseEdge, ResourceCourseMapping, Resource
from app.schemas.course_graph import (
    CourseNodeResponse,
    CourseNodeDetail,
    CourseEdgeResponse,
    ResourceBrief,
)

router = APIRouter()


@router.get("/course-nodes", response_model=List[CourseNodeResponse])
def get_course_nodes(db: Session = Depends(get_db)):
    """获取所有课程节点"""
    nodes = db.query(CourseNode).filter(CourseNode.is_active == 1).all()
    return nodes


@router.get("/course-edges", response_model=List[CourseEdgeResponse])
def get_course_edges(db: Session = Depends(get_db)):
    """获取所有课程前置关系"""
    edges = db.query(CourseEdge).all()
    return edges


@router.get("/course-nodes/{node_id}", response_model=CourseNodeDetail)
def get_course_node_detail(node_id: int, db: Session = Depends(get_db)):
    """获取单个课程节点详情 + 关联资源 + 前置/后续课程"""
    node = db.query(CourseNode).filter(CourseNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="课程节点不存在")

    # 关联资源
    mappings = (
        db.query(ResourceCourseMapping)
        .filter(ResourceCourseMapping.course_node_id == node_id)
        .all()
    )
    resource_ids = [m.resource_id for m in mappings]
    resources = (
        db.query(Resource)
        .filter(Resource.id.in_(resource_ids))
        .all() if resource_ids else []
    )

    # 前置课程（指向当前节点的边）
    prereq_edges = (
        db.query(CourseEdge)
        .filter(CourseEdge.target_node_id == node_id, CourseEdge.relation_type == "prerequisite")
        .all()
    )
    prereq_ids = [e.source_node_id for e in prereq_edges]
    prerequisites = (
        db.query(CourseNode).filter(CourseNode.id.in_(prereq_ids)).all()
        if prereq_ids else []
    )

    # 后续课程（从当前节点出发的边）
    dependent_edges = (
        db.query(CourseEdge)
        .filter(CourseEdge.source_node_id == node_id)
        .all()
    )
    dependent_ids = [e.target_node_id for e in dependent_edges]
    dependents = (
        db.query(CourseNode).filter(CourseNode.id.in_(dependent_ids)).all()
        if dependent_ids else []
    )

    return CourseNodeDetail(
        id=node.id,
        title=node.title,
        slug=node.slug,
        summary=node.summary,
        difficulty=node.difficulty,
        category=node.category,
        is_active=node.is_active,
        resources=[ResourceBrief(id=r.id, title=r.title, url=r.url, resource_type=r.resource_type) for r in resources],
        prerequisites=[CourseNodeResponse.model_validate(p) for p in prerequisites],
        dependents=[CourseNodeResponse.model_validate(d) for d in dependents],
    )
