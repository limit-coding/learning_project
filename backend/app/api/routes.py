from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import (
    UserProfileCreate,
    UserProfileResponse,
    RecommendationResponse,
    ScoreBreakdown
)
from app.models.models import UserProfile, Course, Recommendation
from app.services.recommendation_engine import RecommendationEngine
from app.services.llm_service import LLMService

router = APIRouter()
recommendation_engine = RecommendationEngine()
llm_service = LLMService()


@router.post("/profiles", response_model=UserProfileResponse)
def create_user_profile(
    profile: UserProfileCreate,
    db: Session = Depends(get_db)
):
    """创建用户画像"""
    db_profile = UserProfile(
        current_knowledge=profile.current_knowledge.model_dump(),
        learning_goals=profile.learning_goals.model_dump(),
        career_direction=profile.career_direction.model_dump()
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/profiles/{profile_id}", response_model=UserProfileResponse)
def get_user_profile(profile_id: int, db: Session = Depends(get_db)):
    """获取用户画像"""
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="用户画像不存在")
    return profile


@router.get("/recommendations/{profile_id}", response_model=List[RecommendationResponse])
async def get_recommendations(
    profile_id: int,
    top_n: int = 5,
    refresh: bool = False,
    db: Session = Depends(get_db)
):
    """获取课程推荐（refresh=true 强制重新计算）"""
    # 获取用户画像
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="用户画像不存在")

    # 复用已有推荐记录，避免重复调用 LLM
    if not refresh:
        existing = (
            db.query(Recommendation)
            .filter(Recommendation.profile_id == profile_id)
            .limit(top_n)
            .all()
        )
        if existing:
            course_ids = [r.course_id for r in existing]
            courses_map = {
                c.id: c
                for c in db.query(Course).filter(Course.id.in_(course_ids)).all()
            }
            return [
                RecommendationResponse(
                    course=courses_map[r.course_id],
                    match_score=float(r.match_score),
                    recommendation_reason=r.recommendation_reason or "",
                    score_breakdown=ScoreBreakdown(**r.score_breakdown)
                )
                for r in existing
                if r.course_id in courses_map
            ]

    # 获取所有课程
    all_courses = db.query(Course).all()
    if not all_courses:
        raise HTTPException(status_code=404, detail="暂无课程数据")

    # 计算推荐
    top_courses = recommendation_engine.get_top_courses(profile, all_courses, top_n)

    user_profile_dict = {
        "current_knowledge": profile.current_knowledge,
        "learning_goals": profile.learning_goals,
        "career_direction": profile.career_direction
    }

    # 一次 LLM 调用批量生成所有推荐理由（原来是 N 次串行调用）
    courses_info_list = [
        {
            "course_code": item["course"].course_code,
            "title": item["course"].title,
            "programming_languages": item["course"].programming_languages,
            "difficulty_level": item["course"].difficulty_level,
            "topics": item["course"].topics,
        }
        for item in top_courses
    ]
    match_scores_list = [item["score"] for item in top_courses]

    reasons = await llm_service.batch_generate_reasons(
        user_profile=user_profile_dict,
        courses_info=courses_info_list,
        match_scores=match_scores_list,
    )

    # 批量写入推荐记录
    recommendations = []
    for item, reason in zip(top_courses, reasons):
        course = item["course"]
        score = item["score"]
        breakdown = item["breakdown"]

        db.add(Recommendation(
            profile_id=profile_id,
            course_id=course.id,
            match_score=score,
            recommendation_reason=reason,
            score_breakdown=breakdown
        ))

        recommendations.append(
            RecommendationResponse(
                course=course,
                match_score=score,
                recommendation_reason=reason,
                score_breakdown=ScoreBreakdown(**breakdown)
            )
        )

    db.commit()
    return recommendations
