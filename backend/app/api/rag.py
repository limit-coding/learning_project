from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rag import SearchRequest, SearchResult, ChatRetrieveRequest, ChatRetrieveResponse
from app.services.rag_service import RAGService
from app.services.llm_service import LLMService

router = APIRouter()
rag_service = RAGService()
llm_service = LLMService()

MIN_CONTEXT_THRESHOLD = 0.05


@router.post("/search", response_model=list[SearchResult])
def search(req: SearchRequest, db: Session = Depends(get_db)):
    """向量/关键词检索，返回相关文档片段"""
    results = rag_service.search(db, req.query, req.top_k)
    return [SearchResult(**r) for r in results]


@router.post("/chat/retrieve", response_model=ChatRetrieveResponse)
async def chat_retrieve(req: ChatRetrieveRequest, db: Session = Depends(get_db)):
    """检索增强问答：检索 + LLM 生成回答"""
    results = rag_service.search(db, req.question, top_k=5)

    has_enough = any(r["score"] >= MIN_CONTEXT_THRESHOLD for r in results)

    if not has_enough:
        return ChatRetrieveResponse(
            answer="根据现有站内资料，暂时无法找到与您问题相关的内容。请尝试换个关键词或稍后再试。",
            sources=[],
            has_enough_context=False,
        )

    contexts = [r["content"] for r in results]
    answer = await llm_service.generate_rag_answer(req.question, contexts)

    if not answer:
        answer = "抱歉，暂时无法生成回答。请稍后再试。"

    return ChatRetrieveResponse(
        answer=answer,
        sources=[SearchResult(**r) for r in results],
        has_enough_context=True,
    )
