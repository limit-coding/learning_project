from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.api.routes import router as recommend_router
from app.api.course_graph import router as course_graph_router
from app.api.resource import router as resource_router
from app.api.roadmap import router as roadmap_router
from app.api.rag import router as rag_router
from app.api.review import router as review_router

settings = get_settings()

app = FastAPI(
    title="AI 学习资源站",
    description="面向计算机与通信方向的学习资源与学习路径平台",
    version="2.0.0",
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(recommend_router, prefix="/api", tags=["recommendations"])
app.include_router(course_graph_router, prefix="/api", tags=["course-graph"])
app.include_router(resource_router, prefix="/api", tags=["resources"])
app.include_router(roadmap_router, prefix="/api", tags=["roadmap"])
app.include_router(rag_router, prefix="/api", tags=["rag"])
app.include_router(review_router, prefix="/api", tags=["review"])


@app.get("/")
def root():
    return {"message": "AI 学习资源站 API", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.on_event("startup")
def startup():
    """启动时自动建表（开发阶段），生产环境用 Alembic"""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: 数据库建表失败（如果用 Alembic 迁移可忽略）: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
