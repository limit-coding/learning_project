from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, JSON
from sqlalchemy.sql import func
from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)

    # 当前知识基础
    current_knowledge = Column(JSON, nullable=False)
    # {
    #   "programming_languages": ["Python", "C++"],
    #   "completed_courses": ["CS50"],
    #   "skill_level": "beginner" | "intermediate" | "advanced"
    # }

    # 学习目标
    learning_goals = Column(JSON, nullable=False)
    # {
    #   "target_skills": ["deep_learning", "computer_vision"],
    #   "specific_topics": ["CNN", "transformers"]
    # }

    # 职业方向
    career_direction = Column(JSON, nullable=False)
    # {
    #   "target_role": "AI_engineer" | "researcher" | "data_scientist",
    #   "preferred_language": "Python" | "C++" | "Java",
    #   "industry": "tech" | "research" | "finance"
    # }

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    institution = Column(String(100))

    description = Column(Text)
    difficulty_level = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    estimated_hours = Column(Integer)

    # 技术标签
    programming_languages = Column(JSON, nullable=False)  # 存储为JSON数组
    topics = Column(JSON, nullable=False)  # 存储为JSON数组
    prerequisites = Column(JSON)  # 存储为JSON数组

    # 领域分类
    domain = Column(String(50), nullable=False)  # deep_learning, computer_vision, NLP, etc.

    # 适合的职业方向
    suitable_for_careers = Column(JSON)  # 存储为JSON数组

    # 课程链接
    url = Column(Text)
    platform = Column(String(50))

    # 质量指标
    rating = Column(Numeric(3, 2))
    num_reviews = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=False, index=True)

    # 推荐元数据
    match_score = Column(Numeric(5, 2), nullable=False)
    recommendation_reason = Column(Text)

    # 评分细节
    score_breakdown = Column(JSON)
    # {
    #   "language_match": 30,
    #   "difficulty_match": 22,
    #   "domain_relevance": 25,
    #   "prerequisite_fit": 18
    # }

    recommended_at = Column(DateTime(timezone=True), server_default=func.now())
