from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.deps import get_current_user, get_current_user_optional
from app.database import get_db
from app.models.models import Comment, Post, User
from app.schemas.community import (
    CommentOut,
    CreateCommentRequest,
    CreatePostRequest,
    PostDetail,
    PostListItem,
)
from app.services.community_ai import trigger_ai_reply
from app.services.resource_extractor import trigger_resource_extraction

router = APIRouter(prefix="/community")


@router.get("/posts", response_model=list[PostListItem])
def list_posts(
    course_tag: str | None = Query(None),
    sort: str = Query("new", pattern="^(new|hot)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Post)
    if course_tag:
        q = q.filter(Post.course_tag == course_tag)
    if sort == "hot":
        q = q.order_by(Post.view_count.desc(), Post.created_at.desc())
    else:
        q = q.order_by(Post.created_at.desc())
    posts = q.offset(skip).limit(limit).all()

    result = []
    for post in posts:
        comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        item = PostListItem(
            id=post.id,
            title=post.title,
            content=post.content,
            course_tag=post.course_tag,
            needs_ai=post.needs_ai,
            ai_answered=post.ai_answered,
            view_count=post.view_count,
            comment_count=comment_count,
            share_url=post.share_url,
            author=post.author,
            created_at=post.created_at,
        )
        result.append(item)
    return result


@router.post("/posts", response_model=PostListItem, status_code=status.HTTP_201_CREATED)
def create_post(
    req: CreatePostRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = Post(
        title=req.title,
        content=req.content,
        author_id=current_user.id,
        course_tag=req.course_tag,
        needs_ai=req.needs_ai,
        share_url=req.share_url or None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    if req.needs_ai:
        background_tasks.add_task(
            trigger_ai_reply,
            post.id,
            f"请对这个帖子给出解答：\n{req.title}\n{req.content}",
        )

    if req.share_url:
        background_tasks.add_task(
            trigger_resource_extraction,
            req.share_url,
            req.course_tag,
            current_user.username,
        )

    return PostListItem(
        id=post.id,
        title=post.title,
        content=post.content,
        course_tag=post.course_tag,
        needs_ai=post.needs_ai,
        ai_answered=post.ai_answered,
        view_count=post.view_count,
        comment_count=0,
        share_url=post.share_url,
        author=current_user,
        created_at=post.created_at,
    )


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .options(
            joinedload(Post.author),
            joinedload(Post.comments).joinedload(Comment.author),
            joinedload(Post.comments).joinedload(Comment.replies).joinedload(Comment.author),
        )
        .filter(Post.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    db.query(Post).filter(Post.id == post_id).update({"view_count": Post.view_count + 1})
    db.commit()

    top_level = [c for c in post.comments if c.parent_id is None]
    top_level.sort(key=lambda c: c.created_at)

    comments_out = [_build_comment_out(c) for c in top_level]

    comment_count = len(post.comments)
    return PostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        course_tag=post.course_tag,
        needs_ai=post.needs_ai,
        ai_answered=post.ai_answered,
        view_count=post.view_count + 1,
        comment_count=comment_count,
        share_url=post.share_url,
        author=post.author,
        created_at=post.created_at,
        comments=comments_out,
    )


def _build_comment_out(comment: Comment) -> CommentOut:
    replies = sorted(comment.replies, key=lambda c: c.created_at)
    return CommentOut(
        id=comment.id,
        content=comment.content,
        is_ai=comment.is_ai,
        author=comment.author,
        created_at=comment.created_at,
        replies=[_build_comment_out(r) for r in replies],
    )


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    req: CreateCommentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    if req.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == req.parent_id,
            Comment.post_id == post_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="父评论不存在")

    comment = Comment(
        post_id=post_id,
        parent_id=req.parent_id,
        author_id=current_user.id,
        content=req.content,
        is_ai=False,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    if "@AI助手" in req.content:
        background_tasks.add_task(
            trigger_ai_reply,
            post_id,
            req.content.replace("@AI助手", "").strip() or req.content,
            comment.id,
        )

    return CommentOut(
        id=comment.id,
        content=comment.content,
        is_ai=comment.is_ai,
        author=current_user,
        created_at=comment.created_at,
        replies=[],
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权删除此帖子")
    db.delete(post)
    db.commit()
