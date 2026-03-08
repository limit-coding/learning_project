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
from app.services.llm_service import DeepSeekService

router = APIRouter()
recommendation_engine = RecommendationEngine()
llm_service = DeepSeekService()


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
    db: Session = Depends(get_db)
):
    """获取课程推荐"""
    # 获取用户画像
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="用户画像不存在")

    # 获取所有课程
    all_courses = db.query(Course).all()
    if not all_courses:
        raise HTTPException(status_code=404, detail="暂无课程数据")

    # 计算推荐
    top_courses = recommendation_engine.get_top_courses(profile, all_courses, top_n)

    # 生成推荐理由（使用LLM）
    recommendations = []
    for item in top_courses:
        course = item["course"]
        score = item["score"]
        breakdown = item["breakdown"]

        # 调用LLM生成推荐理由
        reason = await llm_service.generate_recommendation_reason(
            user_profile={
                "current_knowledge": profile.current_knowledge,
                "learning_goals": profile.learning_goals,
                "career_direction": profile.career_direction
            },
            course_info={
                "title": course.title,
                "programming_languages": course.programming_languages,
                "difficulty_level": course.difficulty_level,
                "topics": course.topics
            },
            match_score=score
        )

        # 保存推荐记录
        recommendation = Recommendation(
            profile_id=profile_id,
            course_id=course.id,
            match_score=score,
            recommendation_reason=reason,
            score_breakdown=breakdown
        )
        db.add(recommendation)

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
