"""
社区 AI 智能体：负责生成并保存 AI 回复
触发时机：
  1. 评论内容含 @AI助手
  2. 发帖时勾选了 needs_ai=True
  3. APScheduler 定时扫描无人回复的帖子（>30分钟）

上下文来源（按优先级叠加）：
  A. CourseAssistantService — 课程 JSON 数据（章节重点/路线/资源）
  B. 社区历史帖子 — 同课程标签下已回答的相似问题
  C. 审核通过的用户投稿资源 — resource_course_mappings 关联
"""
import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Comment, CourseNode, Post, Resource, ResourceCourseMapping
from app.services.llm_service import LLMService
from app.services.course_assistant import CourseAssistantService

llm = LLMService()
course_assistant = CourseAssistantService()

AI_SYSTEM_PROMPT = """你是知南社区的 AI 课程助手，专注于北邮课程相关的学习答疑。
回答要简洁、有帮助，使用 Markdown 格式，重点突出。
如果提供了课程资料或社区历史解答，请优先基于这些内容作答，不要泛泛而谈。
如果问题和课程无关，礼貌说明你主要回答课程学习相关问题。"""


def _get_community_context(db: Session, post: Post) -> str:
    """从社区历史中找同课程标签下已回答的相似帖子，作为参考上下文"""
    if not post.course_tag:
        return ""

    past_posts = (
        db.query(Post)
        .filter(
            Post.course_tag == post.course_tag,
            Post.id != post.id,
            Post.ai_answered == True,
        )
        .order_by(Post.created_at.desc())
        .limit(3)
        .all()
    )

    if not past_posts:
        return ""

    parts = []
    for p in past_posts:
        top_replies = (
            db.query(Comment)
            .filter(Comment.post_id == p.id, Comment.parent_id == None)
            .order_by(Comment.is_ai.desc(), Comment.created_at.asc())
            .limit(2)
            .all()
        )
        if not top_replies:
            continue
        reply_text = "\n".join(f"  回复：{r.content[:300]}" for r in top_replies)
        parts.append(f"问题：{p.title}\n{p.content[:200]}\n{reply_text}")

    if not parts:
        return ""

    return "【社区历史解答（同课程相似问题）】\n\n" + "\n\n---\n\n".join(parts)


def _get_resource_context(db: Session, course_tag: str) -> str:
    """从数据库中取审核通过的、与课程标签相关的用户投稿资源"""
    # 通过 course_nodes 名称或 slug 模糊关联
    resources = (
        db.query(Resource)
        .join(ResourceCourseMapping, Resource.id == ResourceCourseMapping.resource_id)
        .join(CourseNode, ResourceCourseMapping.course_node_id == CourseNode.id)
        .filter(
            Resource.status == "approved",
            CourseNode.title.contains(course_tag),
        )
        .limit(6)
        .all()
    )

    if not resources:
        return ""

    lines = ["【社区审核资源】"]
    for r in resources:
        line = f"- [{r.resource_type}] {r.title}"
        if r.summary:
            line += f"：{r.summary[:120]}"
        if r.url:
            line += f"  {r.url}"
        lines.append(line)

    return "\n".join(lines)


async def _gen_reply(
    post_title: str,
    post_content: str,
    question: str,
    course_tag: str | None,
    community_ctx: str,
    resource_ctx: str,
) -> str:
    # A. 课程 JSON 上下文（CourseAssistantService）
    course_ctx = ""
    if course_tag:
        try:
            course_ctx = course_assistant.build_answer_context(
                question=question,
                course_title=course_tag,
            )
        except Exception:
            pass

    # 拼装 prompt，有啥用啥
    sections = [f"帖子标题：{post_title}\n帖子内容：{post_content}"]
    if course_ctx:
        sections.append(f"【课程知识库】\n{course_ctx}")
    if community_ctx:
        sections.append(community_ctx)
    if resource_ctx:
        sections.append(resource_ctx)
    sections.append(f"用户提问：{question}")

    result = await llm._call_llm(
        system_prompt=AI_SYSTEM_PROMPT,
        user_prompt="\n\n".join(sections),
        max_tokens=900,
    )
    return result.get("content") or "抱歉，我暂时无法回答这个问题，请稍后再试。"


def _save_ai_comment(db: Session, post_id: int, content: str, parent_id: int | None = None):
    comment = Comment(
        post_id=post_id,
        parent_id=parent_id,
        author_id=None,
        content=content,
        is_ai=True,
    )
    db.add(comment)
    db.query(Post).filter(Post.id == post_id).update({"ai_answered": True})
    db.commit()


def trigger_ai_reply(post_id: int, question: str, parent_id: int | None = None):
    """在 BackgroundTask 中调用，异步生成 AI 回复后写库"""
    async def _run():
        db = SessionLocal()
        try:
            post = db.query(Post).filter(Post.id == post_id).first()
            if not post:
                return

            # 同步预取两种社区上下文（DB 查询在 async 函数外完成）
            community_ctx = _get_community_context(db, post)
            resource_ctx  = _get_resource_context(db, post.course_tag) if post.course_tag else ""

            reply = await _gen_reply(
                post_title=post.title,
                post_content=post.content,
                question=question,
                course_tag=post.course_tag,
                community_ctx=community_ctx,
                resource_ctx=resource_ctx,
            )
            _save_ai_comment(db, post_id, reply, parent_id)
        finally:
            db.close()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(_run())
        else:
            loop.run_until_complete(_run())
    except RuntimeError:
        asyncio.run(_run())


def check_unanswered_posts():
    """APScheduler 定时任务：扫描 30 分钟内无人回复的帖子，触发 AI 介入"""
    from datetime import datetime, timedelta, timezone
    db = SessionLocal()
    try:
        threshold = datetime.now(timezone.utc) - timedelta(minutes=30)
        posts = (
            db.query(Post)
            .filter(
                Post.ai_answered == False,
                Post.created_at <= threshold,
            )
            .all()
        )
        for post in posts:
            has_human_reply = any(not c.is_ai for c in post.comments)
            if not has_human_reply:
                question = f"请对这个问题给出解答：\n{post.title}\n{post.content}"
                trigger_ai_reply(post.id, question)
    finally:
        db.close()
