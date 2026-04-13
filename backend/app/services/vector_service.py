from typing import List, Dict, Optional


class VectorService:
    """向量服务占位实现，后续阶段用 pgvector 替换"""

    _instance: Optional["VectorService"] = None

    def __new__(cls) -> "VectorService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._context_cache: Dict[str, str] = {}
        self._initialized = True

    def index_courses(self, courses: List[Dict]):
        return

    def search_similar_courses(self, query: str, top_k: int = 3) -> List[Dict]:
        return []

    def get_course_context(self, course_code: str) -> str:
        if course_code in self._context_cache:
            return self._context_cache[course_code]
        context = f"课程代码: {course_code}。这是一个用于推荐理由生成的占位上下文。"
        self._context_cache[course_code] = context
        return context
