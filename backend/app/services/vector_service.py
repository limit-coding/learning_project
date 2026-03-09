import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
import json


class VectorService:
    """向量数据库服务 - RAG 核心（单例，避免重复加载模型）"""

    _instance: Optional["VectorService"] = None

    def __new__(cls) -> "VectorService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(name="courses")
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        # 课程上下文内存缓存，避免重复读取 ChromaDB
        self._context_cache: Dict[str, str] = {}
        self._initialized = True

    def index_courses(self, courses: List[Dict]):
        """将课程数据索引到向量库"""
        for course in courses:
            doc_text = self._build_course_text(course)
            embedding = self.model.encode(doc_text).tolist()

            self.collection.add(
                ids=[course['course_code']],
                embeddings=[embedding],
                documents=[doc_text],
                metadatas=[{
                    'title': course['title'],
                    'description': course['description'],
                    'topics': json.dumps(course.get('topics', [])),
                    'difficulty': course['difficulty_level']
                }]
            )

    def search_similar_courses(self, query: str, top_k: int = 3) -> List[Dict]:
        """语义搜索相似课程"""
        query_embedding = self.model.encode(query).tolist()
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        return [{
            'course_code': results['ids'][0][i],
            'document': results['documents'][0][i],
            'metadata': results['metadatas'][0][i],
            'distance': results['distances'][0][i]
        } for i in range(len(results['ids'][0]))]

    def get_course_context(self, course_code: str) -> str:
        """获取课程的详细上下文（带内存缓存）"""
        if course_code in self._context_cache:
            return self._context_cache[course_code]
        results = self.collection.get(ids=[course_code])
        context = results['documents'][0] if results['documents'] else ""
        self._context_cache[course_code] = context
        return context

    def _build_course_text(self, course: Dict) -> str:
        """构建课程的文本表示"""
        return f"""课程: {course['title']}
机构: {course['institution']}
描述: {course['description']}
难度: {course['difficulty_level']}
主题: {', '.join(course.get('topics', []))}
语言: {', '.join(course.get('programming_languages', []))}
前置: {', '.join(course.get('prerequisites', []))}"""
