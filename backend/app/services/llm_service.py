import httpx
from typing import Dict, Optional
from app.config import get_settings

settings = get_settings()


class DeepSeekService:
    """DeepSeek API 集成服务"""

    def __init__(self):
        self.api_key = settings.deepseek_api_key
        self.api_base = settings.deepseek_api_base
        self.timeout = 10.0

    async def generate_recommendation_reason(
        self,
        user_profile: Dict,
        course_info: Dict,
        match_score: float
    ) -> str:
        """生成个性化推荐理由"""

        if not self.api_key:
            # 降级：使用模板化理由
            return self._generate_template_reason(user_profile, course_info, match_score)

        prompt = self._build_prompt(user_profile, course_info, match_score)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": "你是一位专业的学习顾问，擅长为学生推荐合适的课程。"},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 150,
                        "temperature": 0.7
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    reason = result["choices"][0]["message"]["content"].strip()
                    return reason
                else:
                    # API调用失败，使用模板
                    return self._generate_template_reason(user_profile, course_info, match_score)

        except Exception as e:
            print(f"DeepSeek API调用失败: {e}")
            return self._generate_template_reason(user_profile, course_info, match_score)

    def _build_prompt(
        self,
        user_profile: Dict,
        course_info: Dict,
        match_score: float
    ) -> str:
        """构建提示词"""
        prompt = f"""请根据以下信息，为用户生成一段简洁的课程推荐理由（50-80字）。

用户画像：
- 当前知识：{user_profile.get('current_knowledge', {})}
- 学习目标：{user_profile.get('learning_goals', {})}
- 职业方向：{user_profile.get('career_direction', {})}

课程信息：
- 课程名称：{course_info.get('title')}
- 编程语言：{course_info.get('programming_languages')}
- 难度：{course_info.get('difficulty_level')}
- 主题：{course_info.get('topics')}

匹配分数：{match_score}/100

请生成推荐理由，说明为什么这门课程适合该用户。"""
        return prompt

    def _generate_template_reason(
        self,
        user_profile: Dict,
        course_info: Dict,
        match_score: float
    ) -> str:
        """生成模板化推荐理由（降级方案）"""
        difficulty = course_info.get('difficulty_level', 'intermediate')
        topics = course_info.get('topics', [])
        languages = course_info.get('programming_languages', [])

        difficulty_map = {
            "beginner": "入门级",
            "intermediate": "中级",
            "advanced": "高级"
        }

        reason = f"这是一门{difficulty_map.get(difficulty, '中级')}课程，"

        if topics:
            reason += f"涵盖{', '.join(topics[:2])}等核心主题，"

        if languages:
            reason += f"使用{', '.join(languages[:2])}编程语言，"

        career_goal = user_profile.get('career_direction', {}).get('target_role', '')
        if career_goal:
            reason += f"非常适合想要成为{career_goal}的学习者。"
        else:
            reason += "适合深度学习方向的学习者。"

        return reason
