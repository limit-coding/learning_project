# 邮路——智能定制化课程推荐平台 · AI 提示词台账

**AI 工具：** DeepSeek API、Claude Code (claude-sonnet-4-6)、Trae IDE  
**开发人员：** 2024210195-吕诚昊 · 2024210196-冯熙凯  
**说明：** 记录项目设计与迭代过程中向 AI 提出的需求和实现结果

---

## 提示词记录表

| 功能编号 | 需求描述（向 AI 提出的要求） | 实现结果（AI 生成的代码/文档） | 涉及文件 | 日期 | 版本 | 效果评价 |
|------|--------------------------|-------------------------------|---------|------|------|---------|
| 1 | 需求：设计整体系统架构，包含用户认证、课程图谱、AI 课程助手、学习路径规划、资源管理五个模块，用 Python 实现 | 结果：AI 帮助梳理了系统功能架构，确定了 5 个核心模块：用户认证模块（JWT Token）、课程图谱模块、AI 课程助手模块、学习路径规划模块、资源管理模块 | 需求分析文档、概要设计文档 | 2024-03 | v1.0 | 架构清晰，模块划分合理 |
| 2 | 需求：设计用户认证系统，支持用户注册、登录、JWT 令牌认证，让系统能够保存用户信息，不要注册后就忘记 | 结果：AI 生成了 security.py（密码加密和 JWT 令牌生成）、auth.py（注册/登录接口）、User 模型定义（id、username、email、hashed_password 等字段） | `backend/app/core/security.py`<br>`backend/app/api/auth.py`<br>`backend/app/models/models.py` | 2024-03 | v1.0 | 认证逻辑完整，安全性好 |
| 3 | 需求：设计课程知识图谱数据结构，包含课程节点和课程关系边 | 结果：AI 生成了 CourseNode 模型（课程节点）、CourseEdge 模型（课程关系边）、课程详情 JSON 结构设计 | `backend/app/models/models.py`<br>`backend/app/api/course_graph.py` | 2024-03 | v1.0 | 数据结构合理，支持知识图谱展示 |
| 4 | 需求：实现 AI 课程问答功能，根据课程资料回答用户问题，支持 DeepSeek API 调用 | 结果：AI 生成了 CourseAssistantService 类（加载课程 JSON、组装上下文）、LLMService 类（调用 DeepSeek API）、chat 接口（POST /api/chat）和流式问答接口 | `backend/app/services/course_assistant.py`<br>`backend/app/services/llm_service.py`<br>`backend/app/api/chat.py` | 2024-04 | v1.5 | 问答准确，支持流式输出 |
| 5 | 需求：实现学习路径生成功能，根据用户目标生成个性化学习路径，有降级方案 | 结果：AI 生成了 generate_roadmap 接口、规则回退机制、路径数据结构（nodes, edges） | `backend/app/api/roadmap.py` | 2024-04 | v1.5 | 路径生成合理，有降级方案 |
| 6 | 需求：设计前端 AI 聊天页面，支持 Markdown 渲染和流式显示，手机端侧边栏可折叠 | 结果：AI 生成了 AIChatPage.tsx 聊天页面组件、ChatMessage 消息组件、Markdown 渲染逻辑、流式消息处理，手机端（<768px）默认折叠侧边栏 | `frontend/src/pages/AIChatPage.tsx`<br>`frontend/src/components/Chat/CourseChat.tsx` | 2024-04 | v1.5 | 界面美观，交互流畅，移动端适配好 |
| 7 | 需求：设计课程列表页面，支持课程分类筛选和搜索 | 结果：AI 生成了 CourseListPage.tsx 课程列表页面、课程分类筛选逻辑、Ant Design Table 组件使用 | `frontend/src/pages/CourseListPage.tsx` | 2024-04 | v1.5 | 筛选功能完善 |
| 8 | 需求：将课程材料转换为结构化 JSON 数据，设计提示词模板 | 结果：AI 生成了 material_to_json.py 材料转换脚本、course_material_to_json.md 提示词模板、课程 JSON 数据结构规范 | `ai_material_pipeline/scripts/material_to_json.py`<br>`ai_material_pipeline/prompts/course_material_to_json.md` | 2024-05 | v2.0 | 转换效果好，数据结构清晰 |
| 9 | 需求：根据课程章节生成课程学习指南 | 结果：AI 生成了 course_guide_from_chapters.py 章节处理脚本、课程指南 JSON 结构、知识点提取逻辑 | `ai_material_pipeline/scripts/course_guide_from_chapters.py` | 2024-05 | v2.0 | 指南生成准确 |
| 10 | 需求：设计 Docker 部署方案，包含后端、前端容器和数据库配置 | 结果：AI 生成了 docker-compose.yml 容器编排、backend/Dockerfile 后端容器、frontend/Dockerfile 前端容器、PostgreSQL 数据库配置 | `docker-compose.yml`<br>`backend/Dockerfile`<br>`frontend/Dockerfile` | 2024-05 | v2.0 | 部署方案完整 |
| 11 | 需求：实现完整的用户注册流程，包含邮箱验证码注册、密码重置，防刷机制 | 结果：AI 生成了 verification.py（内存验证码缓存，TTL=600s，60s 冷却）、send-code 接口、register 接口、reset-password 接口，SMTP 邮件发送集成 | `backend/app/core/verification.py`<br>`backend/app/api/auth.py`<br>`frontend/src/pages/AuthPage.tsx` | 2024-05 | v2.0 | 注册流程安全，防暴力刷机制有效 |
| 12 | 需求：实现学生社区功能，支持帖子发布、嵌套评论、按课程标签筛选、热度/时间排序 | 结果：AI 生成了 community.py 后端接口（帖子增删查、评论嵌套树）、CommunityPage.tsx 帖子列表、PostDetailPage.tsx 帖子详情与评论渲染 | `backend/app/api/community.py`<br>`frontend/src/pages/CommunityPage.tsx`<br>`frontend/src/pages/PostDetailPage.tsx` | 2024-05 | v2.0 | 社区功能完整，嵌套评论渲染正确 |
| 13 | 需求：社区 AI 自动答疑，帖子支持"需要 AI 解答"选项，@AI助手触发回复，每 5 分钟定时扫描未回复帖子兜底 | 结果：AI 生成了 community_ai.py 服务（三层上下文：课程知识+帖子内容+评论历史）、CommunityAIService 类、APScheduler 定时任务注册（每 5 分钟）、AI 回复以紫色边框+机器人头像区分 | `backend/app/services/community_ai.py`<br>`backend/app/main.py`<br>`frontend/src/pages/PostDetailPage.tsx` | 2024-05 | v2.0 | AI 答疑效果好，三路触发机制稳定 |
| 14 | 需求：实现文件上传功能，支持 PDF、图片、ZIP，最大 50MB，UUID 命名防路径冲突 | 结果：AI 生成了 upload.py 接口（POST /api/upload）、MIME 类型校验、UUID 文件名生成、上传目录挂载为静态文件服务 | `backend/app/api/upload.py`<br>`backend/app/main.py` | 2024-05 | v2.0 | 上传稳定，路径冲突问题解决 |
| 15 | 需求：资源合规检查流程，用户分享链接或上传文件后，AI 轻量审核相关性，通过则存为 pending 等待管理员审核 | 结果：AI 生成了 resource_extractor.py（抓取页面标题→AI 合规判断→存 pending），合规判断调用 DeepSeek API 约 100 tokens，不相关直接跳过入库 | `backend/app/services/resource_extractor.py`<br>`backend/app/api/community.py` | 2024-05 | v2.0 | 合规过滤有效，减少无关资源进入审核队列 |
| 16 | 需求：管理员资源审核页面，展示待审资源，可通过/拒绝，通过时可修正资源类型和填写摘要 | 结果：AI 生成了 AdminReviewPage.tsx（待审列表、通过/拒绝按钮、折叠编辑表单）、review.py 后端接口（GET /api/resources/pending、POST /api/resources/{id}/review） | `backend/app/api/review.py`<br>`frontend/src/pages/AdminReviewPage.tsx` | 2024-05 | v2.0 | 审核流程顺畅 |
| 17 | 需求：nginx 部署配置，前端静态资源、后端 API 反向代理、上传文件目录访问，解决 HTML 缓存导致 JS 更新不生效问题 | 结果：AI 配置了 nginx sites-enabled 文件：`/api/` 反向代理到 127.0.0.1:8000、`/uploads/` alias 到 backend/uploads 目录、`index.html` 添加 `Cache-Control: no-cache` 头防浏览器缓存旧 JS bundle | `deploy/nginx.conf.example`<br>`/etc/nginx/sites-enabled/learnpath.tech`（服务器） | 2026-06 | v2.1 | 部署后页面加载正常，JS 更新即时生效 |
| 18 | 需求：修复帖子详情页加载卡住问题，进入帖子后长时间 loading，有时完全无响应 | 结果：AI 诊断出 useEffect 依赖数组缺少 token（`[id]` → `[id, token]`），导致 token 未就绪时接口提前返回但 loading 状态未重置；修复后页面正常加载 | `frontend/src/pages/PostDetailPage.tsx` | 2026-06 | v2.1 | 修复后帖子秒级加载，无卡顿 |
| 19 | 需求：修复上传文件后发帖，share_url 始终为空，PDF 附件不显示在帖子中 | 结果：AI 诊断出两处 bug：(1) useState 闭包捕获旧值，改用 useRef<Map> 避免陈旧闭包；(2) 用户在上传响应返回前点击发布（竞态条件），增加 `fileList.some(f => f.status === 'uploading')` 检查拦截 | `frontend/src/pages/CommunityPage.tsx`<br>`frontend/src/services/communityApi.ts` | 2026-06 | v2.1 | 修复后 PDF 附件稳定保存并显示 |
| 20 | 需求：支持多文件上传，一个帖子可以附带多个 PDF/图片/ZIP 文件 | 结果：AI 将 Upload 组件 `maxCount={1}` 改为 `maxCount={5}`，添加 `multiple` 属性；fileList 用 Map 维护每个文件的 `{url, name}`；多文件以 JSON 数组 `[{"url":..., "name":...}]` 存入 share_url 字段，向后兼容旧字符串格式 | `frontend/src/pages/CommunityPage.tsx`<br>`frontend/src/services/communityApi.ts`<br>`frontend/src/pages/PostDetailPage.tsx` | 2026-06 | v2.1 | 多文件上传正常，旧数据无影响 |
| 21 | 需求：下载 PDF 时保留原始文件名，而不是 UUID 随机字符串 | 结果：AI 修改 uploadFile API 返回 `{url, name}`（name 为原始文件名）；PostDetailPage 的下载按钮改为 `download={entry.name}`，让浏览器保存时使用原始文件名 | `frontend/src/services/communityApi.ts`<br>`frontend/src/pages/PostDetailPage.tsx` | 2026-06 | v2.1 | 下载文件名正确显示为用户上传时的原始名称 |
| 22 | 需求：管理员审核页面的 PDF 链接文字显示乱码（UUID 字符串），改为显示资源标题 | 结果：AI 修改 AdminReviewPage，本地上传文件（url 以 `/uploads/` 开头）显示 `r.title`（原始文件名），外部链接截断显示 URL | `frontend/src/pages/AdminReviewPage.tsx` | 2026-06 | v2.1 | 审核页面文件名清晰可读 |
| 23 | 需求：修复资源提取器对本地上传文件发起 HTTP 请求失败的问题（/uploads/ 路径无法直接 HTTP 访问） | 结果：AI 修改 resource_extractor.py，对 `/uploads/` 路径跳过 HTTP 抓取，直接用原始文件名构造资源信息，传给 AI 合规判断 | `backend/app/services/resource_extractor.py` | 2026-06 | v2.1 | 本地文件正常进入待审队列 |
| 24 | 需求：修复 GET /api/resources/pending 接口 404，被 GET /api/resources/{resource_id} 路由拦截 | 结果：AI 诊断出 FastAPI 路由注册顺序问题（resource_router 先于 review_router 注册，parameterized 路由拦截了静态路径），将 review_router 提前到 resource_router 之前注册 | `backend/app/main.py` | 2026-06 | v2.1 | 路由冲突消除，管理员审核页面正常加载 |
| 25 | 需求：修复资源提取器收到的 url 是整个 JSON 数组字符串而非单个 URL | 结果：AI 修改 community.py 发帖逻辑，先 JSON.parse share_url，遍历数组，每个文件单独调用 trigger_resource_extraction，传递对应的 url 和 name | `backend/app/api/community.py` | 2026-06 | v2.1 | 多文件场景下每个文件独立合规审核，无解析错误 |
| 26 | 需求：帖子课程标签筛选器改为分学期树形展示（TreeSelect），便于按学期浏览课程 | 结果：AI 设计了 COURSE_TREE 数据结构（大一上/下→大二上/下→大三上，含各学期课程子节点），将筛选器从 Select 改为 TreeSelect；发帖弹窗中课程关联也改为 TreeSelect | `frontend/src/pages/CommunityPage.tsx` | 2026-06 | v2.1 | 树形筛选结构清晰，课程按学期分组一目了然 |
| 27 | 需求：修复改用 TreeSelect 后排序下拉框消失（Select import 被覆盖） | 结果：AI 检查 import 语句，发现 Select 被误删，恢复 `Select, TreeSelect` 同时导入 | `frontend/src/pages/CommunityPage.tsx` | 2026-06 | v2.1 | 排序和筛选功能同时正常 |

---

## 附：主要 AI 提示词模板

### 合规审核提示词（resource_extractor.py）

```
判断下面这个资源是否与课程学习相关（如课件、笔记、题目、教材、学习视频、编程资料等均算相关）。
只输出 JSON，不输出其他内容：
{"relevant": true或false, "reason": "一句话说明"}

不相关的例子：娱乐视频、广告、新闻、社交帖子、与学习完全无关的内容。

资源信息：
{info}
```

**调用模型：** DeepSeek API（约 100 tokens）  
**触发时机：** 用户发帖携带 URL 或上传文件后，BackgroundTask 异步执行

---

### 社区 AI 答疑提示词（community_ai.py）

上下文组装顺序：
1. **课程知识层**：从 ai_material_pipeline/outputs 加载对应课程 JSON（章节重点、复习要点、学习路线）
2. **帖子层**：帖子标题 + 内容
3. **评论历史层**：已有评论列表（最多取前 N 条）

```
你是邮路学习平台的 AI 助手，专门帮助北邮学生解答课程问题。
请根据以下课程资料和帖子内容，给出准确、简洁的回答。

【课程资料】
{course_context}

【帖子标题】{title}
【帖子内容】{content}

【已有评论】
{comments}

请用中文回答，重点突出，如有代码示例请用代码块格式。
```

**调用模型：** DeepSeek API  
**触发条件：** (1) 发帖时勾选"需要 AI 解答"；(2) 评论中 @AI助手；(3) APScheduler 每 5 分钟兜底扫描

---

### 课程问答提示词（course_assistant.py）

上下文优先级：
1. 用户指定 course_slug → 精确匹配，评分 100
2. 课程全称匹配 → 评分 80
3. 课程简称/代码匹配 → 评分 50-60
4. 关键词/章节匹配 → 评分最高 40

```
你是北邮课程学习助手，具备以下课程资料（JSON 上下文）：

{course_context}

用户问题：{question}

请根据课程资料准确回答。如需补充外部知识，可使用 web_search 工具。
回答用中文，支持 Markdown 格式。
```

**调用模型：** DeepSeek API（默认 max_tokens=1000，temperature=0.5）  
**工具调用：** 支持 web_search，最多 2 轮，每次取 3 条搜索结果

---

*文档最后更新：2026-06-15*
