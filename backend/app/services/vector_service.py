from typing import List, Dict, Optional
import json


class VectorService:
    """
    线上精简版向量服务占位实现。

    说明：
    - 本项目当前线上版本的推荐流程主要依赖规则评分 + LLM 文本理由；
    - 向量检索 / RAG 功能是后续增强项，如果在这里强依赖 sentence-transformers
      和 chromadb，线上环境会因为版本兼容问题导致整个 API 无法启动；
    - 因此，生产部署阶段暂时提供一个“空实现”，保持对外接口一致，
      但不实际调用向量数据库。
    """

    _instance: Optional["VectorService"] = None

    def __new__(cls) -> "VectorService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        # 不加载任何重型模型 / 向量库，仅做占位
        self._context_cache: Dict[str, str] = {}
        self._initialized = True

    def index_courses(self, courses: List[Dict]):
        """
        占位方法：线上暂不进行向量索引。
        保留签名，便于后续无缝切回真实向量服务实现。
        """
        return

    def search_similar_courses(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        占位方法：返回空列表，表示暂时不使用语义检索结果。
        """
        return []

    def get_course_context(self, course_code: str) -> str:
        """
        获取课程上下文：
        - 当前实现返回一个简单的占位文本，避免下游 LLM 提示完全缺乏上下文；
        - 如果后续接入真实向量库，可以在这里读 chroma / pgvector 等。
        """
        if course_code in self._context_cache:
            return self._context_cache[course_code]

        # 简单占位上下文
        context = f"课程代码: {course_code}。这是一个用于推荐理由生成的占位上下文。"
        self._context_cache[course_code] = context
        return context
