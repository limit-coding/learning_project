import json
import httpx
from typing import Dict, List, Optional, Any
from app.config import get_settings
from app.services.search_service import get_search_service

settings = get_settings()

# 搜索工具定义
SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": "搜索互联网获取最新信息。当用户问到实时信息、新闻、或需要外部知识时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词"
                }
            },
            "required": ["query"]
        }
    }
}


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

    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        tools: Optional[List[Dict]] = None,
        messages: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """调用 LLM，支持 function calling"""
        if not self.api_key or self.api_key.startswith("your_"):
            return {"content": None, "tool_calls": None}

        try:
            # 构建消息列表
            if messages is None:
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]

            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.5
            }

            if tools:
                payload["tools"] = tools

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    choice = data["choices"][0]["message"]
                    result = {
                        "content": choice.get("content", "").strip() if choice.get("content") else None,
                        "tool_calls": choice.get("tool_calls"),
                        "reasoning_content": choice.get("reasoning_content")
                    }
                    return result
                else:
                    print(f"LLM 返回非 200: {response.status_code}")
                    print(f"响应内容: {response.text[:500]}")
        except Exception as e:
            print(f"LLM 调用失败: {e}")
        return {"content": None, "tool_calls": None}

    async def chat_with_search(
        self,
        question: str,
        course_context: str,
        max_search_rounds: int = 2,
    ) -> str:
        """带搜索功能的课程问答"""
        system_prompt = f"""你是 BUPT 课程学习助手。基于以下课程资料回答用户问题。

如果用户问到课程内容、考试重点等，优先使用课程资料回答。
如果需要更多信息（如实际应用、最新进展、学习资源等），可以使用搜索工具。

课程资料：
{course_context}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        search_service = get_search_service()

        for _ in range(max_search_rounds):
            result = await self._call_llm(
                system_prompt="",
                user_prompt="",
                max_tokens=1500,
                tools=[SEARCH_TOOL],
                messages=messages,
            )

            # 如果 AI 想调用搜索工具
            if result["tool_calls"]:
                tool_call = result["tool_calls"][0]
                func_name = tool_call["function"]["name"]
                args = json.loads(tool_call["function"]["arguments"])

                if func_name == "web_search":
                    query = args.get("query", "")
                    search_results = search_service.search(query, num_results=3)

                    # 格式化搜索结果
                    if search_results:
                        search_context = "\n".join(
                            f"- {r['title']}: {r['snippet']}"
                            for r in search_results
                        )
                    else:
                        search_context = "未找到相关搜索结果。"

                    # 添加 assistant 消息（带 tool_calls 和 reasoning_content）
                    assistant_msg = {
                        "role": "assistant",
                        "content": None,
                        "reasoning_content": result.get("reasoning_content", ""),
                        "tool_calls": [{
                            "id": tool_call["id"],
                            "type": "function",
                            "function": {
                                "name": func_name,
                                "arguments": tool_call["function"]["arguments"]
                            }
                        }]
                    }
                    messages.append(assistant_msg)

                    # 添加 tool 结果
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": search_context
                    })
                    continue

            # 没有工具调用，返回最终回答
            if result["content"]:
                return result["content"]
            # 如果没有内容也没有 tool_calls，可能是格式问题
            return "抱歉，AI 暂时无法回答。请换个问题试试。"

        return "抱歉，处理超时。请简化您的问题。"

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

        result = await self._call_llm(
            "你是学习路径规划专家，只返回 JSON，不加任何解释。",
            prompt,
            2000
        )
        content = result.get("content")
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
