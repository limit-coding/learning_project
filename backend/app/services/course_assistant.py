"""
手写代码部分：
1.数据结构定义
2.课程数据加载
3.课程索引构建
4.问题意图识别
5.课程匹配
6.上下文组装
7.对外入口
"""

"""
AI课程助手核心服务

这个模块负责把已经整理好的课程json数据转换成AI问答可用的上下文
它不直接负责HTTP请求，也不直接负责页面展示，只处理课程资料和用户问题之间的匹配逻辑
"""

import json
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

@dataclass
class CourseMatch:
  """课程匹配结果"""

  slug: str
  title: str
  score: float
  reason: str

@dataclass
class QuestionIntent:
  """用户问题意图"""

  raw_question: str
  intent_type: str
  keywords: List[str] = field(default_factory=list)
  wants_exam: bool = False
  wants_summary: bool = False
  wants_route: bool = False
  wants_resource: bool = False
  wants_chapter: bool = False

@dataclass
class ContextBlock:
  """给大模型使用的一段课程上下文"""
  title: str
  content: str
  source_type: str

class CourseAssistantService:
  """AI课程助手服务"""

  def __init__(self, data_dir: Optional[str]=None):
    self.data_dir = data_dir or self._default_data_dir()
    self.courses: Dict[str, dict] = {}
    self.title_index: Dict[str, str] = {}
    self.keyword_index: Dict[str, List[str]] = {}
    self.loaded = False

  def _default_data_dir(self) -> str:
    return os.path.abspath(
      os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
        "ai_material_pipeline",
        "outputs",
      )
    )
  
  def load_courses(self) -> Dict[str, dict]:
    """加载课程json数据

    返回值是课程字典，key为课程slug，value为课程完整数据。
    这个函数会做缓存，如果已经加载过，就直接返回self.courses
    
    """
    if self.loaded:
      return self.courses
    
    self.courses = {}
    self.title_index = {}
    self.keyword_index = {}

    if not os.path.exists(self.data_dir):
      print(f"课程数据目录不存在：{self.data_dir}")
      self.loaded = True
      return self.courses
    
    for filename in os.listdir(self.data_dir):
      if not filename.endswith(".from_chapters.json"):
        continue

      filepath = os.path.join(self.data_dir, filename)

      try:
        with open(filepath,"r",encoding="utf-8") as file:
          course_data = json.load(file)
      except json.JSONDecodeError as exc:
        print(f"课程JSON解析失败：{filename}, {exc}")
        continue
      except OSError as exc:
        print(f"课程文件读取失败:{filename}, {exc}")
        continue

      slug=str(course_data.get("slug","")).strip()
      title=str(course_data.get("title","")).strip()

      if not slug or not title:
        print(f"课程文件缺少slug 或title:{filename}")
        continue

      self.courses[slug] = course_data

      self._add_title_index(title, slug)

      short_title=str(course_data.get("shortTitle","")).strip()
      if short_title:
        self._add_title_index(short_title, slug)
      
      code=str(course_data.get("code","")).strip()

      if code:
        self._add_title_index(code, slug)

    self._build_keyword_index()
    self.loaded = True
    return self.courses
    
  def _add_title_index(self, name: str, slug: str) -> None:
    """把课程名称加入标题索引"""

    normalized = self._normalize_text(name)
    if not normalized:
      return
    self.title_index[normalized] = slug

  def _normalize_text(self, text: str) -> str:
    """统一文本格式，便于后续匹配"""

    if not text:
      return ""
    text = str(text).strip().lower()
    text=re.sub(r"\s+","",text)
    #把中文括号改成英文括号方便匹配
    text=text.replace("（","(").replace("）",")")
    return text

  def _build_keyword_index(self) -> None:
    """根据课程标题，简介和章节标题建立关键词索引"""

    self.keyword_index = {}

    for slug, course_data in self.courses.items():
      keywords = []

      title=course_data.get("title","")
      short_title=course_data.get("shortTitle","")
      summary=course_data.get("summary","")

      keywords.extend(self._extract_keywords(title))
      keywords.extend(self._extract_keywords(short_title))
      keywords.extend(self._extract_keywords(summary))

      for chapter in course_data.get("chapters",[]):
        keywords.extend(self._extract_keywords(chapter.get("title","")))
        keywords.extend(self._extract_keywords(chapter.get("focus","")))

      unique_keywords = []
      seen = set()

      for word in keywords:
        if word and word not in seen:
          seen.add(word)
          unique_keywords.append(word)

      self.keyword_index[slug] = unique_keywords

  def _extract_keywords(self, text: str) -> List[str]:
    """从文本中提取简单关键词"""

    if not text:
      return []
    text = str(text)
    chinese_words=re.findall(r"[\u4e00-\u9fff]{2,}",text)
    english_words=re.findall(r"[a-zA-Z0-9_+-]{2,}",text)

    result = []

    for word in chinese_words:
      result.append(word.lower())

    for word in english_words:
      result.append(word.lower())

    return result

  def analyze_question(self, question: str) -> QuestionIntent:
    """分析用户问题意图"""
    """_normalize_text 具体做了这几件事：转小写、去空格、中文括号换英文括号。"""

    raw_question=question or ""
    normalized = self._normalize_text(raw_question)
    keywords = self._extract_keywords(raw_question)
    """_contains_any就是检查用户问题里有没有这些词的任意一个，命中一个就返回true，比如返回wants_exam wants_summary"""
    wants_exam = self._contains_any(
      normalized,
      ["考试","期末","重点","考点","复习","真题","挂科","高分"]
    )

    wants_summary = self._contains_any(
      normalized,
      ["讲什么","介绍","概述","简介","主要内容","学什么","是什么"]
    )

    wants_route = self._contains_any(
      normalized,
      ["怎么学","学习路线","路线","顺序","先学","后学","规划","安排"]
    )

    wants_resource = self._contains_any(
      normalized,
      ["资源","资料","教材","视频","公开课","链接","参考书","网站"]
    )

    wants_chapter = self._contains_any(
      normalized,
      ["章节","第","章","知识点","重点章节","哪一章"]
    )

    if wants_exam:
      intent_type="exam"
    elif wants_route:
      intent_type="route"
    elif wants_resource:
      intent_type="resource"
    elif wants_chapter:
      intent_type="chapter"
    elif wants_summary:
      intent_type="summary"
    else:
      intent_type="general"

    return QuestionIntent(
      raw_question = raw_question,
      intent_type = intent_type,
      keywords = keywords,
      wants_exam = wants_exam,
      wants_summary = wants_summary,
      wants_route = wants_route,
      wants_resource = wants_resource,
      wants_chapter = wants_chapter,
    )

  def _contains_any(self, text: str, words: List[str]) -> bool:
    """判断文本中是否包含任意关键词"""

    if not text:
      return False

    for word in words:
      normalized_word = self._normalize_text(word)
      if normalized_word and normalized_word in text:
        return True

    return False

  def match_courses(
    self,
    question: str,
    course_slug: Optional[str] = None,
    course_title: Optional[str] = None,
    limit: int = 3,
  ) -> List[CourseMatch]:
    """根据用户问题匹配相关课程"""

    self.load_courses()

    if not self.courses:
      return []

    direct_match = self._match_direct_course(course_slug, course_title)
    if direct_match:
      return [direct_match]

    normalized_question = self._normalize_text(question)
    question_keywords = self._extract_keywords(question)
    scored_matches: List[CourseMatch] = []

    for slug, course_data in self.courses.items():
      """score是相关度分数。用来排序哪门课最匹配用户的问题
      - 用户问题里包含课程全称 → 加 80 分（很强的匹配信号）
      - 包含课程简称 → 加 60 分
      - 包含课程简称 → 加 60 分
      - 包含课程代码 → 加 50 分
      - 关键词重叠 → 最多加 40 分
      - 命中章节标题 → 最多再加 40 分
      - 关键词重叠 → 最多加 40 分
      - 命中章节标题 → 最多再加 40 分
      最后所有课程按总分排序，取前 3 名返回给 LLM。分数本身没有实际单位，只是用来比大小的。

      最后所有课程按总分排序，取前 3 名返回给 LLM。分数本身没有实际单位，只是用来比大小的。
      """
      score = 0.0
      reasons = []

      title=course_data.get("title","")
      short_title=course_data.get("shortTitle","")
      code=course_data.get("code","")

      normalized_title = self._normalize_text(title)
      normalized_short_title = self._normalize_text(short_title)
      normalized_code = self._normalize_text(code)

      if normalized_title and normalized_title in normalized_question:
        score+=80
        reasons.append("命中课程全称")

      if normalized_short_title and normalized_short_title in normalized_question:
        score+=60
        reasons.append("命中课程简称")

      if normalized_code and normalized_code in normalized_question:
        score+=50
        reasons.append("命中课程代码")

      keyword_score = self._calculate_keyword_score(slug, question_keywords)
      if keyword_score>0:
        score+=keyword_score
        reasons.append(f"命中课程关键词 {keyword_score:.0f} 分")

      chapter_score = self._calculate_chapter_score(course_data, normalized_question)
      if chapter_score>0:
        score+=chapter_score
        reasons.append(f"命中章节内容 {chapter_score:.0f} 分")

      if score<=0:
        continue

      scored_matches.append(
        CourseMatch(
          slug = slug,
          title = title or slug,
          score = score,
          reason="；".join(reasons),
        )
      )

    scored_matches.sort(key=lambda item:item.score, reverse=True)
    return scored_matches[:limit]

  def _match_direct_course(
    self,
    course_slug: Optional[str],
    course_title: Optional[str],
  ) -> Optional[CourseMatch]:
    """根据明确传入的课程 slug 或标题直接匹配课程"""

    if course_slug:
      normalized_slug = course_slug.strip()
      if normalized_slug in self.courses:
        course_data = self.courses[normalized_slug]
        return CourseMatch(
          slug = normalized_slug,
          title=course_data.get("title",normalized_slug),
          score = 100.0,
          reason="用户已指定课程 slug",
        )

    if course_title:
      normalized_title = self._normalize_text(course_title)

      if normalized_title in self.title_index:
        slug = self.title_index[normalized_title]
        course_data = self.courses.get(slug, {})
        return CourseMatch(
          slug = slug,
          title=course_data.get("title",slug),
          score = 100.0,
          reason="用户已指定课程名称",
        )

      for title_key, slug in self.title_index.items():
        """ 第三段：为什么两个 if 都是 85 分

          if normalized_title and normalized_title in title_key:
              ...

          # 第二个：索引里的key 包含在 用户输入的标题里
          if title_key and title_key in normalized_title:
              ...

          这是两个方向相反的模糊匹配，覆盖两种情况：

          ┌────────────────────────────────┬──────────────────────────────────────────────────────────────┐
          │              情况              │                             例子                             │
          ├────────────────────────────────┼──────────────────────────────────────────────────────────────┤
          │ 用户输入的是缩写，索引里是全称 │ 用户输入「离散」，索引有「离散数学」→ 第一个 if 命中         │
          ├────────────────────────────────┼──────────────────────────────────────────────────────────────┤
          │ 用户输入的是全称，索引里是缩写 │ 用户输入「离散数学基础」，索引有「离散数学」→ 第二个 if 命中 │
          └────────────────────────────────┴──────────────────────────────────────────────────────────────┘

          两种情况匹配质量差不多，所以都给 85 分。如果要区分精确度可以给不同分，但这里简单处理统一 85 就够了。"""
        if normalized_title and normalized_title in title_key:
          course_data = self.courses.get(slug, {})
          return CourseMatch(
            slug = slug,
            title=course_data.get("title",slug),
            score = 85.0,
            reason="课程名称模糊匹配",
          )

        if title_key and title_key in normalized_title:
          course_data = self.courses.get(slug, {})
          return CourseMatch(
            slug = slug,
            title=course_data.get("title",slug),
            score = 85.0,
            reason="课程名称模糊匹配",
          )

    return None

  def _calculate_keyword_score(
    self,
    slug: str,
    question_keywords: List[str],
  ) -> float:
    """根据问题关键词和课程关键词计算分数"""

    course_keywords = self.keyword_index.get(slug, [])
    if not course_keywords or not question_keywords:
      return 0.0

    course_keyword_set = set(course_keywords)
    score = 0.0

    for word in question_keywords:
      if word in course_keyword_set:
        score+=8

    return min(score, 40.0)

  def _calculate_chapter_score(
    self,
    course_data:dict,
    normalized_question: str,
  ) -> float:
    """判断问题是否命中课程章节标题或章节重点"""

    score = 0.0

    for chapter in course_data.get("chapters",[]):
      title=self._normalize_text(chapter.get("title",""))
      focus=self._normalize_text(chapter.get("focus",""))

      if title and title in normalized_question:
        score+=20

      if focus and self._has_partial_overlap(normalized_question, focus):
        score+=10

    return min(score, 40.0)

  def _has_partial_overlap(self, left: str, right: str) -> bool:
    """判断两个文本是否有一定关键词重叠"""

    left_keywords = set(self._extract_keywords(left))
    right_keywords = set(self._extract_keywords(right))

    if not left_keywords or not right_keywords:
      return False

    overlap = left_keywords & right_keywords
    return len(overlap)>=2

  def build_answer_context(
    self,
    question: str,
    course_slug: Optional[str] = None,
    course_title: Optional[str] = None,
  ) -> str:
    """对外入口：根据用户问题生成 AI 回答上下文"""

    """
    self.load_courses() 把json文件加载进内存，有缓存机制，第一次调用才真正读文件，之后调用内存里的数据
    intent 分析用户问答啥问题，考试重点还是学习路线，保存到intent里，方便后续评分然后让LLM调用不同的上下文
    matches 根据用户问题找最相关课程，最多返回三门
    question 用户原始问题
    cours_slug 前端传了ID，就精确匹配
    course_title 课程名称也行
    """
    self.load_courses()
    intent = self.analyze_question(question)
    matches = self.match_courses(
      question = question,
      course_slug = course_slug,
      course_title = course_title,
      limit = 3,
    )

    if not matches:
      return self._build_course_overview_context(intent)

    blocks: List[ContextBlock] = []
    header_lines = [
      "以下内容来自系统已经整理好的课程资料。",
      f"用户问题意图：{intent.intent_type}",
      "匹配到的课程：",
    ]

    for match in matches:
      header_lines.append(f"- {match.title}（匹配原因：{match.reason}）")

    blocks.append(
      ContextBlock(
        title="匹配说明",
        content="\n".join(header_lines),
        source_type="meta",
      )
    )

    for match in matches:
      course_data = self.courses.get(match.slug, {})
      blocks.extend(self._build_course_blocks(course_data, intent, question))

    return self._join_context_blocks(blocks)

  def _build_course_overview_context(self, intent:QuestionIntent) -> str:
    """没有匹配到具体课程时，返回课程列表概览"""

    self.load_courses()
    blocks = [
      ContextBlock(
        title="可用课程列表",
        content="用户没有指定明确课程，下面是系统当前可回答的课程范围。",
        source_type="overview",
      )
    ]

    for course_data in self.courses.values():
      title=course_data.get("title","未知课程")
      short_title=course_data.get("shortTitle","")
      summary=course_data.get("summary","")
      route=course_data.get("route",[])
      route_text=" -> ".join(route[:5]) if route else "暂无路线"
      content = (
        f"课程：{title}"
        f"{f'（{short_title}）' if short_title else ''}\n"
        f"简介：{summary[:120]}\n"
        f"学习路线：{route_text}"
      )
      blocks.append(
        ContextBlock(
          title = title,
          content = content,
          source_type = intent.intent_type,
        )
      )

    return self._join_context_blocks(blocks, limit=12)

  def _build_course_blocks(
    self,
    course_data:dict,
    intent:QuestionIntent,
    question: str,
  ) -> List[ContextBlock]:
    """根据问题意图为某门课程生成上下文块"""

    blocks = [
      self._build_basic_info_block(course_data)
    ]

    if intent.wants_route:
      blocks.append(self._build_route_block(course_data))
    elif intent.wants_exam:
      blocks.append(self._build_exam_block(course_data))
      blocks.extend(self._build_relevant_chapter_blocks(course_data, question, limit=5))
    elif intent.wants_resource:
      blocks.append(self._build_resource_block(course_data))
    elif intent.wants_chapter:
      blocks.extend(self._build_relevant_chapter_blocks(course_data, question, limit=6))
    elif intent.wants_summary:
      blocks.append(self._build_summary_block(course_data))
      blocks.extend(self._build_relevant_chapter_blocks(course_data, question, limit=3))
    else:
      blocks.append(self._build_route_block(course_data))
      blocks.append(self._build_summary_block(course_data))
      blocks.extend(self._build_relevant_chapter_blocks(course_data, question, limit=4))

    return [block for block in blocks if block.content.strip()]

  def _build_basic_info_block(self, course_data:dict) -> ContextBlock:
    """课程基础信息上下文"""

    title=course_data.get("title","未知课程")
    short_title=course_data.get("shortTitle","")
    summary=course_data.get("summary","")
    outcomes=course_data.get("outcomes",[])

    lines = [
      f"课程：{title}{f'（{short_title}）' if short_title else ''}",
      f"简介：{summary}",
    ]

    if outcomes:
      lines.append("学习产出：")
      for item in outcomes[:6]:
        lines.append(f"- {item}")

    return ContextBlock(title=f"{title} 基本信息",content="\n".join(lines),source_type="basic")

  def _build_route_block(self, course_data:dict) -> ContextBlock:
    """学习路线上下文"""

    title=course_data.get("title","未知课程")
    route=course_data.get("route",[])
    if not route:
      return ContextBlock(title=f"{title} 学习路线",content="",source_type="route")

    lines=["学习路线："]
    for index, item in enumerate(route, 1):
      lines.append(f"{index}. {item}")

    return ContextBlock(title=f"{title} 学习路线",content="\n".join(lines),source_type="route")

  def _build_exam_block(self, course_data:dict) -> ContextBlock:
    """考试重点上下文"""

    title=course_data.get("title","未知课程")
    review_notes=course_data.get("reviewNotes",[])
    lines = []

    if review_notes:
      lines.append("考试/复习重点：")
      for item in review_notes[:10]:
        lines.append(f"- {item}")

    study_summary=course_data.get("studySummary",[])
    for section in study_summary[:3]:
      section_title=section.get("title","复习要点")
      lines.append(f"{section_title}：")
      for point in section.get("points",[])[:5]:
        lines.append(f"- {point}")

    return ContextBlock(title=f"{title} 考试重点",content="\n".join(lines),source_type="exam")

  def _build_resource_block(self, course_data:dict) -> ContextBlock:
    """学习资源上下文"""

    title=course_data.get("title","未知课程")
    resources = []
    resources.extend(course_data.get("resources",[]))
    resources.extend(course_data.get("publicMaterials",[]))

    lines=["学习资源："]
    for item in resources[:12]:
      res_title=item.get("title","未命名资源")
      res_type=item.get("type","资料")
      description=item.get("description","")
      url=item.get("url","")
      line = f"- {res_title}（{res_type}）：{description}"
      if url:
        line+=f" {url}"
      lines.append(line)

    return ContextBlock(title=f"{title} 学习资源",content="\n".join(lines),source_type="resource")

  def _build_summary_block(self, course_data:dict) -> ContextBlock:
    """学习总结上下文"""

    title=course_data.get("title","未知课程")
    study_summary=course_data.get("studySummary",[])
    lines = []

    for section in study_summary[:5]:
      lines.append(f"{section.get('title','学习要点')}：")
      for point in section.get("points",[])[:6]:
        lines.append(f"- {point}")

    return ContextBlock(title=f"{title} 学习总结",content="\n".join(lines),source_type="summary")

  def _build_relevant_chapter_blocks(
    self,
    course_data:dict,
    question: str,
    limit: int = 5,
  ) -> List[ContextBlock]:
    """选择与问题最相关的章节上下文"""

    title=course_data.get("title","未知课程")
    chapters=course_data.get("chapters",[])
    if not chapters:
      return []

    scored = []
    question_keywords = set(self._extract_keywords(question))
    normalized_question = self._normalize_text(question)

    for chapter in chapters:
      chapter_title=chapter.get("title","")
      focus=chapter.get("focus","")
      checklist=chapter.get("checklist",[])
      chapter_text=" ".join([chapter_title,focus," ".join(checklist)])
      chapter_keywords = set(self._extract_keywords(chapter_text))
      score = 0

      if self._normalize_text(chapter_title) in normalized_question:
        score+=20

      score+=len(question_keywords & chapter_keywords)*5

      if score==0 and not question_keywords:
        score = 1

      scored.append((score, chapter))

    scored.sort(key=lambda item:item[0], reverse=True)
    selected = [chapter for score, chapter in scored[:limit] if score>0]
    if not selected:
      selected = chapters[:min(limit, len(chapters))]

    blocks = []
    for chapter in selected:
      chapter_title=chapter.get("title","未命名章节")
      lines = [
        f"章节：{chapter_title}",
        f"重点：{chapter.get('focus','')}",
      ]
      checklist=chapter.get("checklist",[])
      if checklist:
        lines.append("学习要求：")
        for item in checklist[:6]:
          lines.append(f"- {item}")

      blocks.append(
        ContextBlock(
          title = f"{title} - {chapter_title}",
          content="\n".join(lines),
          source_type="chapter",
        )
      )

    return blocks

  def _join_context_blocks(self, blocks: List[ContextBlock], limit: int=10) -> str:
    """把上下文块合并成给 LLM 的文本"""

    parts = []
    for block in blocks[:limit]:
      if not block.content.strip():
        continue
      parts.append(f"## {block.title}\n{block.content}")

    return "\n\n".join(parts)
  
