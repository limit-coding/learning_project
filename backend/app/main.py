import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import get_settings
from app.database import engine, Base
from app.api.course_graph import router as course_graph_router
from app.api.resource import router as resource_router
from app.api.roadmap import router as roadmap_router
from app.api.review import router as review_router
from app.api.chat import router as chat_router
from app.api.auth import router as auth_router
from app.api.community import router as community_router
from app.api.upload import router as upload_router

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
app.include_router(course_graph_router, prefix="/api", tags=["course-graph"])
app.include_router(resource_router, prefix="/api", tags=["resources"])
app.include_router(roadmap_router, prefix="/api", tags=["roadmap"])
app.include_router(review_router, prefix="/api", tags=["review"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(community_router, prefix="/api", tags=["community"])
app.include_router(upload_router, prefix="/api", tags=["upload"])


@app.get("/")
def root():
    return {"message": "AI 学习资源站 API", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup():
    """启动时自动建表（开发阶段），生产环境用 Alembic"""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: 数据库建表失败（如果用 Alembic 迁移可忽略）: {e}")

    # SQLite 字段迁移：为已存在的表补充新列
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(posts)"))]
            if "share_url" not in cols:
                conn.execute(text("ALTER TABLE posts ADD COLUMN share_url VARCHAR(500)"))
                conn.commit()
    except Exception as e:
        print(f"Warning: 字段迁移失败: {e}")

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.services.community_ai import check_unanswered_posts
        scheduler = BackgroundScheduler()
        scheduler.add_job(check_unanswered_posts, "interval", minutes=5, id="unanswered_posts")
        scheduler.start()
        print("APScheduler started: unanswered post scanner running every 5 minutes")
    except Exception as e:
        print(f"Warning: APScheduler 启动失败: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
