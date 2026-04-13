import re
import json
import httpx
from typing import Dict, List, Optional
from app.config import get_settings

settings = get_settings()


class LLMService:
    """多模型 LLM 服务"""

    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model
        self.api_base = self._get_api_base()

    def _get_api_base(self) -> str:
        if self.provider == "openai":
            return settings.openai_api_base
        elif self.provider == "custom":
            return settings.custom_api_base
        return settings.deepseek_api_base

    async def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> Optional[str]:
        if not self.api_key:
            return None
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
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": max_tokens,
                        "temperature": 0.5
                    }
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"].strip()
                else:
                    print(f"LLM 返回非 200: {response.status_code}")
        except Exception as e:
            print(f"LLM 调用失败: {e}")
        return None

    async def batch_generate_reasons(
        self,
        user_profile: Dict,
        courses_info: List[Dict],
        match_scores: List[float]
    ) -> List[str]:
        """批量生成所有课程推荐理由"""
        n = len(courses_info)
        if not self.api_key:
            return [
                self._generate_template_reason(user_profile, c, s)
                for c, s in zip(courses_info, match_scores)
            ]

        courses_block = ""
        for i, (course, score) in enumerate(zip(courses_info, match_scores), 1):
            courses_block += (
                f"\n课程{i}（匹配分数 {score:.0f}/100）："
                f"\n  标题: {course.get('title', '')}"
                f"\n  难度: {course.get('difficulty_level', '')}"
                f"\n  语言: {', '.join(course.get('programming_languages', []))}"
                f"\n  主题: {', '.join(course.get('topics', []))}"
            )

        prompt = f"""你是专业学习顾问。根据用户画像，为以下{n}门课程各写一句推荐理由（每句30-50字，直接说匹配原因）。

用户：知识={user_profile.get('current_knowledge', {}).get('skill_level','')}, 目标={user_profile.get('learning_goals', {}).get('target_skills',[])}, 职业={user_profile.get('career_direction', {}).get('target_role','')}

课程：{courses_block}
格式（只输出编号和理由，不加其他文字）：
1. [理由]
2. [理由]"""

        content = await self._call_llm("你是专业的学习顾问，回答简洁直接。", prompt, n * 80)
        if content:
            return self._parse_batch_reasons(content, n, user_profile, courses_info, match_scores)

        return [
            self._generate_template_reason(user_profile, c, s)
            for c, s in zip(courses_info, match_scores)
        ]

    def _parse_batch_reasons(self, content: str, n: int, user_profile: Dict, courses_info: List[Dict], match_scores: List[float]) -> List[str]:
        reasons: List[str] = []
        for line in content.splitlines():
            m = re.match(r"^\d+[.、．]\s*(.+)", line.strip())
            if m:
                reasons.append(m.group(1).strip())
        while len(reasons) < n:
            idx = len(reasons)
            reasons.append(self._generate_template_reason(user_profile, courses_info[idx], match_scores[idx]))
        return reasons[:n]

    def _generate_template_reason(self, user_profile: Dict, course_info: Dict, match_score: float) -> str:
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

    async def generate_roadmap(
        self,
        goal: str,
        all_nodes: List[Dict],
        all_edges: List[Dict],
        mastered_slugs: List[str],
    ) -> Optional[Dict]:
        """用 LLM 根据用户目标生成学习路径"""
        node_descriptions = [
            f"- slug: {n['slug']}, title: {n['title']}, difficulty: {n.get('difficulty', 'N/A')}, category: {n.get('category', 'N/A')}"
            for n in all_nodes
        ]
        edge_descriptions = [
            f"- {e['source']} → {e['target']} ({e.get('relation_type', 'prerequisite')})"
            for e in all_edges
        ]

        prompt = f"""根据用户学习目标，从课程图谱中选出一条学习路径。

用户目标：{goal}

已掌握的课程：{', '.join(mastered_slugs) if mastered_slugs else '无'}

可用课程节点：
{chr(10).join(node_descriptions)}

前置关系：
{chr(10).join(edge_descriptions)}

请返回 JSON 格式（不要加 ```json 标记）：
{{
  "nodes": [{{"slug": "...", "is_mastered": false}}],
  "edges": [{{"source": "...", "target": "...", "relation_type": "prerequisite"}}]
}}

规则：
1. nodes 应包含目标所需的所有课程，以及它们的前置课程
2. 已掌握的课程标记 is_mastered: true
3. edges 只包含选中节点之间的关系
4. 按学习顺序排列节点"""

        content = await self._call_llm(
            "你是学习路径规划专家，只返回 JSON，不加任何解释。",
            prompt,
            2000
        )
        if content:
            try:
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[1] if "\n" in content else content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                return json.loads(content.strip())
            except json.JSONDecodeError:
                print(f"LLM 返回的 JSON 解析失败: {content[:200]}")
        return None

    async def generate_rag_answer(self, question: str, contexts: List[str]) -> Optional[str]:
        """基于检索上下文生成回答"""
        if not contexts:
            return None
        context_block = "\n\n".join(f"[资料{i+1}]\n{ctx}" for i, ctx in enumerate(contexts))

        prompt = f"""根据以下站内资料回答用户问题。必须基于资料内容回答，如果资料不足以回答，请明确说明。

站内资料：
{context_block}

用户问题：{question}

要求：
1. 回答必须基于上方资料
2. 如果资料不足，明确说"根据现有资料无法完整回答"
3. 回答简洁准确"""

        return await self._call_llm(
            "你是学习资源站的问答助手，只根据提供的资料回答问题。",
            prompt,
            1000,
        )
