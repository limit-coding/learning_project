from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import CourseNode, CourseEdge, Roadmap
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapResponse,
    RoadmapNode,
    RoadmapEdge,
)
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()


def _build_rule_based_roadmap(
    goal: str,
    all_nodes: List[CourseNode],
    all_edges: List[CourseEdge],
    mastered_slugs: List[str],
) -> dict:
    """规则回退：当 LLM 不可用时，按类别全量返回路径"""
    mastered_set = set(mastered_slugs)
    selected_nodes = []
    selected_edges = []

    for node in all_nodes:
        selected_nodes.append({
            "slug": node.slug,
            "is_mastered": node.slug in mastered_set,
        })

    for edge in all_edges:
        selected_edges.append({
            "source": all_nodes_dict[edge.source_node_id].slug,
            "target": all_nodes_dict[edge.target_node_id].slug,
            "relation_type": edge.relation_type,
        })

    return {"nodes": selected_nodes, "edges": selected_edges}


@router.post("/roadmaps/generate", response_model=RoadmapResponse)
async def generate_roadmap(
    req: RoadmapGenerateRequest,
    db: Session = Depends(get_db),
):
    """根据用户目标生成学习路径"""
    all_nodes = db.query(CourseNode).filter(CourseNode.is_active == 1).all()
    all_edges = db.query(CourseEdge).all()

    if not all_nodes:
        raise HTTPException(status_code=404, detail="暂无课程图谱数据")

    # 构建查找字典
    nodes_dict = {n.id: n for n in all_nodes}
    slug_dict = {n.slug: n for n in all_nodes}

    # 准备数据给 LLM
    nodes_for_llm = [
        {"slug": n.slug, "title": n.title, "difficulty": n.difficulty, "category": n.category}
        for n in all_nodes
    ]
    edges_for_llm = [
        {"source": nodes_dict[e.source_node_id].slug, "target": nodes_dict[e.target_node_id].slug, "relation_type": e.relation_type}
        for e in all_edges
        if e.source_node_id in nodes_dict and e.target_node_id in nodes_dict
    ]

    # 调用 LLM 生成路径
    result = await llm_service.generate_roadmap(
        goal=req.goal,
        all_nodes=nodes_for_llm,
        all_edges=edges_for_llm,
        mastered_slugs=req.mastered_slugs,
    )

    if not result:
        # 回退：规则模板
        mastered_set = set(req.mastered_slugs)
        result_nodes = [
            {"slug": n.slug, "is_mastered": n.slug in mastered_set}
            for n in all_nodes
        ]
        result_edges = [
            {
                "source": nodes_dict[e.source_node_id].slug,
                "target": nodes_dict[e.target_node_id].slug,
                "relation_type": e.relation_type,
            }
            for e in all_edges
            if e.source_node_id in nodes_dict and e.target_node_id in nodes_dict
        ]
        result = {"nodes": result_nodes, "edges": result_edges}

    # 验证 slug 有效性
    valid_slugs = set(slug_dict.keys())
    result["nodes"] = [n for n in result.get("nodes", []) if n.get("slug") in valid_slugs]
    result["edges"] = [
        e for e in result.get("edges", [])
        if e.get("source") in valid_slugs and e.get("target") in valid_slugs
    ]

    # 丰富节点信息
    roadmap_nodes = []
    for n in result["nodes"]:
        slug = n["slug"]
        db_node = slug_dict.get(slug)
        roadmap_nodes.append(RoadmapNode(
            slug=slug,
            title=db_node.title if db_node else slug,
            summary=db_node.summary if db_node else None,
            difficulty=db_node.difficulty if db_node else None,
            is_mastered=n.get("is_mastered", False),
        ))

    roadmap_edges = [
        RoadmapEdge(
            source=e["source"],
            target=e["target"],
            relation_type=e.get("relation_type", "prerequisite"),
        )
        for e in result["edges"]
    ]

    # 存入数据库
    db_roadmap = Roadmap(
        user_goal=req.goal,
        mastered_slugs=req.mastered_slugs,
        result=result,
    )
    db.add(db_roadmap)
    db.commit()
    db.refresh(db_roadmap)

    return RoadmapResponse(
        id=db_roadmap.id,
        user_goal=db_roadmap.user_goal,
        nodes=roadmap_nodes,
        edges=roadmap_edges,
        created_at=db_roadmap.created_at,
    )


@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(roadmap_id: int, db: Session = Depends(get_db)):
    """获取已生成的学习路径"""
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="学习路径不存在")

    slug_dict = {n.slug: n for n in db.query(CourseNode).all()}
    result = roadmap.result or {"nodes": [], "edges": []}

    roadmap_nodes = []
    for n in result.get("nodes", []):
        slug = n.get("slug", "")
        db_node = slug_dict.get(slug)
        roadmap_nodes.append(RoadmapNode(
            slug=slug,
            title=db_node.title if db_node else slug,
            summary=db_node.summary if db_node else None,
            difficulty=db_node.difficulty if db_node else None,
            is_mastered=n.get("is_mastered", False),
        ))

    roadmap_edges = [
        RoadmapEdge(
            source=e.get("source", ""),
            target=e.get("target", ""),
            relation_type=e.get("relation_type", "prerequisite"),
        )
        for e in result.get("edges", [])
    ]

    return RoadmapResponse(
        id=roadmap.id,
        user_goal=roadmap.user_goal,
        nodes=roadmap_nodes,
        edges=roadmap_edges,
        created_at=roadmap.created_at,
    )
