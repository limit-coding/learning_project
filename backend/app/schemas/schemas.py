from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CurrentKnowledge(BaseModel):
    programming_languages: List[str] = Field(..., description="已掌握的编程语言")
    completed_courses: List[str] = Field(default=[], description="已完成的课程")
    skill_level: str = Field(..., description="技能水平: beginner, intermediate, advanced")


class LearningGoals(BaseModel):
    target_skills: List[str] = Field(..., description="目标技能")
    specific_topics: List[str] = Field(default=[], description="具体主题")


class CareerDirection(BaseModel):
    target_role: str = Field(..., description="目标职位")
    preferred_language: str = Field(..., description="偏好编程语言")
    industry: str = Field(default="tech", description="目标行业")


class UserProfileCreate(BaseModel):
    current_knowledge: CurrentKnowledge
    learning_goals: LearningGoals
    career_direction: CareerDirection


class UserProfileResponse(BaseModel):
    id: int
    current_knowledge: dict
    learning_goals: dict
    career_direction: dict
    created_at: datetime

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    course_code: str
    title: str
    institution: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: str
    estimated_hours: Optional[int] = None
    programming_languages: List[str]
    topics: List[str]
    prerequisites: List[str] = []
    domain: str
    suitable_for_careers: List[str] = []
    url: Optional[str] = None
    platform: Optional[str] = None
    rating: Optional[float] = None
    num_reviews: Optional[int] = None


class CourseResponse(CourseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreBreakdown(BaseModel):
    language_match: float
    difficulty_match: float
    domain_relevance: float
    prerequisite_fit: float


class RecommendationResponse(BaseModel):
    course: CourseResponse
    match_score: float
    recommendation_reason: str
    score_breakdown: ScoreBreakdown
