"""RAG 检索服务：文档切片 + 向量检索 + 回答生成

当前阶段使用简单的关键词匹配作为检索基础，
后续可升级为 pgvector 向量检索。
"""
import math
import re
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.models import DocumentChunk, Embedding, Resource


def _tokenize(text: str) -> set:
    """简单分词：中文按字符，英文按单词"""
    chinese = set(re.findall(r'[\u4e00-\u9fff]', text))
    english = set(w.lower() for w in re.findall(r'[a-zA-Z0-9]+', text))
    return chinese | english


def _simple_similarity(query_tokens: set, doc_tokens: set) -> float:
    """Jaccard 相似度"""
    if not query_tokens or not doc_tokens:
        return 0.0
    intersection = len(query_tokens & doc_tokens)
    union = len(query_tokens | doc_tokens)
    return intersection / union if union > 0 else 0.0


class RAGService:
    """RAG 检索服务"""

    def search(
        self,
        db: Session,
        query: str,
        top_k: int = 5,
    ) -> List[Dict]:
        """检索相关文档片段"""
        query_tokens = _tokenize(query)

        chunks = db.query(DocumentChunk).all()
        if not chunks:
            return []

        scored = []
        for chunk in chunks:
            doc_tokens = _tokenize(chunk.content)
            score = _simple_similarity(query_tokens, doc_tokens)
            if score > 0:
                scored.append((chunk, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_k]

        resource_ids = list(set(c.resource_id for c, _ in top))
        resources = {
            r.id: r
            for r in db.query(Resource).filter(Resource.id.in_(resource_ids)).all()
        }

        results = []
        for chunk, score in top:
            res = resources.get(chunk.resource_id)
            results.append({
                "chunk_id": chunk.id,
                "resource_id": chunk.resource_id,
                "resource_title": res.title if res else "未知资源",
                "content": chunk.content,
                "score": round(score, 4),
            })
        return results

    def index_document(
        self,
        db: Session,
        resource_id: int,
        content: str,
        chunk_size: int = 500,
    ) -> int:
        """将文档切片并存储"""
        # 清除旧切片
        db.query(DocumentChunk).filter(DocumentChunk.resource_id == resource_id).delete()

        chunks = []
        for i in range(0, len(content), chunk_size):
            piece = content[i:i + chunk_size].strip()
            if piece:
                chunks.append(DocumentChunk(
                    resource_id=resource_id,
                    chunk_index=len(chunks),
                    content=piece,
                    token_count=len(piece),
                ))

        for c in chunks:
            db.add(c)
        db.flush()

        return len(chunks)
