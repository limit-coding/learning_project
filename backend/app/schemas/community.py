from datetime import datetime
from pydantic import BaseModel


class AuthorOut(BaseModel):
    id: int
    username: str
    display_name: str | None
    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: int
    content: str
    is_ai: bool
    author: AuthorOut | None
    created_at: datetime
    replies: list["CommentOut"] = []
    model_config = {"from_attributes": True}


CommentOut.model_rebuild()


class PostListItem(BaseModel):
    id: int
    title: str
    content: str
    course_tag: str | None
    needs_ai: bool
    ai_answered: bool
    view_count: int
    comment_count: int
    share_url: str | None
    author: AuthorOut
    created_at: datetime
    model_config = {"from_attributes": True}


class PostDetail(PostListItem):
    comments: list[CommentOut] = []


class CreatePostRequest(BaseModel):
    title: str
    content: str
    course_tag: str | None = None
    needs_ai: bool = False
    share_url: str | None = None  # 用户分享的资源链接，AI 自动提取后生成待审核资源


class CreateCommentRequest(BaseModel):
    content: str
    parent_id: int | None = None
