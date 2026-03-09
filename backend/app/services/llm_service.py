import re
import httpx
from typing import Dict, List, Optional
from app.config import get_settings
from app.services.vector_service import VectorService

settings = get_settings()


class LLMService:
    """多模型 LLM 服务 - 支持 DeepSeek/OpenAI/自定义"""

    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model
        self.api_base = self._get_api_base()
        self.vector_service = VectorService()

    def _get_api_base(self) -> str:
        if self.provider == "openai":
            return settings.openai_api_base
        elif self.provider == "custom":
            return settings.custom_api_base
        return settings.deepseek_api_base

    async def batch_generate_reasons(
        self,
        user_profile: Dict,
        courses_info: List[Dict],
        match_scores: List[float]
    ) -> List[str]:
        """批量生成所有课程推荐理由 —— 1 次 LLM 调用替代 N 次"""
        n = len(courses_info)
        if not self.api_key:
            return [
                self._generate_template_reason(user_profile, c, s)
                for c, s in zip(courses_info, match_scores)
            ]

        # 拼接所有课程信息到同一个 prompt
        courses_block = ""
        for i, (course, score) in enumerate(zip(courses_info, match_scores), 1):
            ctx = self.vector_service.get_course_context(course.get("course_code", ""))
            if not ctx:
                ctx = f"课程: {course.get('title', '')}\n难度: {course.get('difficulty_level', '')}"
            courses_block += f"\n课程{i}（匹配分数 {score:.0f}/100）：\n{ctx}\n"

        prompt = f"""你是专业学习顾问。根据用户画像，为以下{n}门课程各写一句推荐理由（每句30-50字，直接说匹配原因）。

用户：知识={user_profile.get('current_knowledge', {}).get('skill_level','')}, 目标={user_profile.get('learning_goals', {}).get('target_skills',[])}, 职业={user_profile.get('career_direction', {}).get('target_role','')}

课程：{courses_block}
格式（只输出编号和理由，不加其他文字）：
1. [理由]
2. [理由]"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "你是专业的学习顾问，回答简洁直接。"},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": n * 80,
                        "temperature": 0.5
                    }
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"].strip()
                    return self._parse_batch_reasons(content, n, user_profile, courses_info, match_scores)
                else:
                    print(f"LLM 返回非 200: {response.status_code}")
        except Exception as e:
            print(f"批量 LLM 调用失败: {e}")

        return [
            self._generate_template_reason(user_profile, c, s)
            for c, s in zip(courses_info, match_scores)
        ]

    def _parse_batch_reasons(
        self,
        content: str,
        n: int,
        user_profile: Dict,
        courses_info: List[Dict],
        match_scores: List[float]
    ) -> List[str]:
        """解析 '1. xxx\\n2. xxx' 格式的批量回复"""
        reasons: List[str] = []
        for line in content.splitlines():
            m = re.match(r"^\d+[.、．]\s*(.+)", line.strip())
            if m:
                reasons.append(m.group(1).strip())
        # 数量不足时用模板补齐
        while len(reasons) < n:
            idx = len(reasons)
            reasons.append(
                self._generate_template_reason(user_profile, courses_info[idx], match_scores[idx])
            )
        return reasons[:n]

    def _generate_template_reason(
        self,
        user_profile: Dict,
        course_info: Dict,
        match_score: float
    ) -> str:
        """模板推荐理由（无 API Key 或降级时使用）"""
        difficulty = course_info.get("difficulty_level", "intermediate")
        topics = course_info.get("topics", [])
        languages = course_info.get("programming_languages", [])
        difficulty_map = {"beginner": "入门级", "intermediate": "中级", "advanced": "高级"}
        reason = f"这是一门{difficulty_map.get(difficulty, '中级')}课程，"
        if topics:
            reason += f"涵盖{', '.join(topics[:2])}等核心主题，"
        if languages:
            reason += f"使用{', '.join(languages[:2])}编程语言，"
        career_goal = user_profile.get("career_direction", {}).get("target_role", "")
        reason += f"非常适合想要成为{career_goal}的学习者。" if career_goal else "适合深度学习方向的学习者。"
        return reason

