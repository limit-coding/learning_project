from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.models import Course, UserProfile


class RecommendationEngine:
    """推荐引擎核心逻辑"""

    def __init__(self):
        self.weights = {
            "language_match": 30,
            "difficulty_match": 25,
            "domain_relevance": 25,
            "prerequisite_fit": 20
        }

    def calculate_language_score(
        self,
        user_preferred_lang: str,
        course_languages: List[str]
    ) -> float:
        """计算编程语言匹配分数（满分30）"""
        if user_preferred_lang in course_languages:
            return 30.0

        # 相似语言映射
        similar_languages = {
            "Python": ["Python3"],
            "C++": ["C", "C++11", "C++14"],
            "Java": ["Kotlin"],
            "JavaScript": ["TypeScript"]
        }

        user_similar = similar_languages.get(user_preferred_lang, [])
        if any(lang in course_languages for lang in user_similar):
            return 15.0

        return 0.0

    def calculate_difficulty_score(
        self,
        user_level: str,
        course_difficulty: str
    ) -> float:
        """计算难度适配分数（满分25）"""
        level_map = {"beginner": 1, "intermediate": 2, "advanced": 3}
        user_num = level_map.get(user_level, 2)
        course_num = level_map.get(course_difficulty, 2)

        diff = course_num - user_num

        if diff == 0:
            return 25.0  # 完美匹配
        elif diff == 1:
            return 20.0  # 略有挑战（推荐）
        elif diff == -1:
            return 15.0  # 略简单（可接受）
        else:
            return 5.0   # 差距过大

    def calculate_domain_score(
        self,
        user_goals: List[str],
        course_topics: List[str]
    ) -> float:
        """计算领域相关度分数（满分25）- 使用Jaccard相似度"""
        user_topics_set = set(user_goals)
        course_topics_set = set(course_topics)

        if not user_topics_set or not course_topics_set:
            return 0.0

        intersection = len(user_topics_set & course_topics_set)
        union = len(user_topics_set | course_topics_set)

        jaccard_similarity = intersection / union if union > 0 else 0
        return jaccard_similarity * 25

    def calculate_prerequisite_score(
        self,
        user_completed: List[str],
        course_prerequisites: List[str]
    ) -> float:
        """计算前置知识满足度（满分20）"""
        if not course_prerequisites:
            return 20.0  # 无前置要求

        user_completed_set = set(user_completed)
        required_set = set(course_prerequisites)

        met_prerequisites = len(user_completed_set & required_set)
        total_prerequisites = len(required_set)

        return (met_prerequisites / total_prerequisites) * 20

    def calculate_match_score(
        self,
        user_profile: UserProfile,
        course: Course
    ) -> Dict[str, float]:
        """计算总匹配分数"""
        # 提取用户画像数据
        current_knowledge = user_profile.current_knowledge
        learning_goals = user_profile.learning_goals
        career_direction = user_profile.career_direction

        # 计算各项分数
        language_score = self.calculate_language_score(
            career_direction.get("preferred_language", "Python"),
            course.programming_languages
        )

        difficulty_score = self.calculate_difficulty_score(
            current_knowledge.get("skill_level", "beginner"),
            course.difficulty_level
        )

        domain_score = self.calculate_domain_score(
            learning_goals.get("target_skills", []),
            course.topics
        )

        prerequisite_score = self.calculate_prerequisite_score(
            current_knowledge.get("completed_courses", []),
            course.prerequisites or []
        )

        # 总分
        total_score = (
            language_score +
            difficulty_score +
            domain_score +
            prerequisite_score
        )

        return {
            "total": round(total_score, 2),
            "breakdown": {
                "language_match": round(language_score, 2),
                "difficulty_match": round(difficulty_score, 2),
                "domain_relevance": round(domain_score, 2),
                "prerequisite_fit": round(prerequisite_score, 2)
            }
        }

    def get_top_courses(
        self,
        user_profile: UserProfile,
        all_courses: List[Course],
        top_n: int = 10
    ) -> List[Dict]:
        """获取Top N推荐课程"""
        scored_courses = []

        for course in all_courses:
            score_data = self.calculate_match_score(user_profile, course)
            scored_courses.append({
                "course": course,
                "score": score_data["total"],
                "breakdown": score_data["breakdown"]
            })

        # 按分数降序排序
        scored_courses.sort(key=lambda x: x["score"], reverse=True)

        # 返回Top N
        return scored_courses[:top_n]
