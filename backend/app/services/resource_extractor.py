"""
用户分享链接/文件时的处理流程：
  1. AI 快速合规判断（~100 tokens，判断是否与课程学习相关）
  2. 不合规 → 跳过，不入库
  3. 合规 → 保存基本信息为 pending，等管理员人工审核决定是否加入知识库
     管理员 approve 后才真正对 AI 可见
"""
import json
import re
import asyncio
import httpx
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import CourseNode, Resource, ResourceCourseMapping
from app.services.llm_service import LLMService
from app.config import get_settings

llm = LLMService()
settings = get_settings()

_COMPLIANCE_PROMPT = """判断下面这个资源是否与课程学习相关（如课件、笔记、题目、教材、学习视频、编程资料等均算相关）。
只输出 JSON，不输出其他内容：
{"relevant": true或false, "reason": "一句话说明"}

不相关的例子：娱乐视频、广告、新闻、社交帖子、与学习完全无关的内容。

资源信息：
{info}"""


def _fetch_title(url: str, timeout: int = 6) -> str:
    """只抓页面 <title> 或文件名，用最少流量做合规判断"""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; ZhinanBot/1.0)"}
    try:
        # 先只下载前 4KB，够拿到 <title>
        with httpx.stream("GET", url, headers=headers, timeout=timeout, follow_redirects=True) as resp:
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            chunk = b""
            for data in resp.iter_bytes(chunk_size=4096):
                chunk += data
                break  # 只要第一块

        if "application/pdf" in content_type or url.lower().endswith(".pdf"):
            filename = url.split("/")[-1].split("?")[0] or "未知PDF"
            return f"PDF文件：{filename}  URL：{url}"

        text = chunk.decode("utf-8", errors="ignore")
        m = re.search(r"<title[^>]*>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
        title = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        return f"标题：{title or '未知'}  URL：{url}"
    except Exception as e:
        # 抓不到就只传 URL，还是能判断
        return f"URL：{url}  (抓取失败: {e})"


async def _check_compliance(resource_info: str) -> tuple[bool, str]:
    """快速合规判断，返回 (是否相关, 原因)"""
    prompt = _COMPLIANCE_PROMPT.replace("{info}", resource_info)
    result = await llm._call_llm(
        system_prompt="你是内容审核助手，只输出 JSON。",
        user_prompt=prompt,
        max_tokens=80,
    )
    raw = result.get("content", "")
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        return True, "无法判断，默认通过"
    try:
        data = json.loads(m.group())
        return bool(data.get("relevant", True)), data.get("reason", "")
    except Exception:
        return True, "解析失败，默认通过"


def _save_pending_resource(
    db: Session,
    url: str,
    title: str,
    course_tag: str | None,
    submitted_by: str,
) -> None:
    if db.query(Resource).filter(Resource.url == url).first():
        return  # 防重复

    resource = Resource(
        title=title[:280],
        url=url,
        resource_type="other",   # 管理员审核时再细化
        summary="（待管理员审核后填写摘要）",
        status="pending",
        submitted_by=submitted_by,
    )
    db.add(resource)
    db.flush()

    if course_tag:
        node = db.query(CourseNode).filter(CourseNode.title.contains(course_tag)).first()
        if node:
            db.add(ResourceCourseMapping(resource_id=resource.id, course_node_id=node.id))

    db.commit()


def trigger_resource_extraction(url: str, course_tag: str | None, submitted_by: str):
    """BackgroundTask 入口：合规检查 → 通过则存为 pending"""
    async def _run():
        db = SessionLocal()
        try:
            # Step 1：轻量抓取标题（不下载全文）
            resource_info = await asyncio.get_event_loop().run_in_executor(
                None, _fetch_title, url
            )
            # Step 2：AI 合规判断（~100 tokens）
            relevant, reason = await _check_compliance(resource_info)
            if not relevant:
                print(f"[resource_extractor] 不相关，跳过入库: {url} | {reason}")
                return
            # Step 3：提取页面标题作为资源标题
            title = resource_info.split("标题：")[-1].split("  ")[0].strip() or url[:100]
            _save_pending_resource(db, url, title, course_tag, submitted_by)
            print(f"[resource_extractor] 已入待审队列: {title}")
        except Exception as e:
            print(f"[resource_extractor] 处理失败 {url}: {e}")
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
