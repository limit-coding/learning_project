# 知南：北邮课程路线系统

知南（Zhinan）是面向北邮学生的 AI 课程学习平台，集课程路线规划、社区讨论、AI 问答于一体。

线上地址：**https://learnpath.tech**

---

## 功能概览

### 课程体系
- 按学院、学期浏览课程列表
- 单课程知识图谱（可视化节点与前置关系）
- 课程详情：章节重点、学习要求、复习要点、公开资料链接

### AI 课程助手
- 基于课程 JSON 资料的专项问答（流式 SSE 输出）
- 支持按课程筛选提问，或直接问北邮课程相关问题
- 快速提问模板：考试重点、学习建议、参考资料等
- 侧边栏可折叠，手机端友好

### 社区讨论
- 用户发帖（支持 Markdown 正文、课程标签、资源分享）
- 嵌套评论，支持 @回复
- @AI助手 触发 AI 自动回复（三层上下文：课程知识库 + 社区历史 + 知识库资源）
- APScheduler 定时扫描：发帖超时未回复自动触发 AI
- 未登录禁止查看，前后端双重拦截

### 资源共享与审核
- 发帖时可附带外部链接或上传文件（PDF / 图片 / ZIP，最大 50MB）
- AI 快速合规检查（约 100 tokens，判断是否与课程学习相关）
- 管理员后台审核（`/admin/review`），通过后进入知识库供 AI 引用
- 扫描版 PDF 走阿里云千问 VL 视觉模型 OCR

### 用户系统
- 注册 / 登录 / JWT 鉴权
- 邮箱验证码重置密码
- 角色：user / admin

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design v5 |
| 后端 | FastAPI + SQLAlchemy 2.0 |
| 数据库 | SQLite（生产）/ PostgreSQL（可选） |
| AI | DeepSeek `deepseek-chat`（问答 + 合规审核） |
| OCR | 阿里云 Qwen VL `qwen-vl-plus`（扫描 PDF） |
| 任务调度 | APScheduler 3.x |
| 部署 | Nginx + Let's Encrypt HTTPS + systemd |

---

## 本地启动

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# 配置 .env（参考下方 AI 配置）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

健康检查：`curl http://localhost:8000/health`

### 前端

```bash
cd frontend
npm install
npm run dev
# 打开 http://localhost:5173
```

---

## AI 配置

`backend/.env`（参考 `backend/.env.example`）：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_deepseek_key
LLM_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com/v1

QWEN_API_KEY=your_aliyun_qwen_key   # 扫描 PDF OCR 用

SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your@163.com
SMTP_PASSWORD=your_smtp_auth_code

SECRET_KEY=your-secret-key
```

未配置 API Key 时，AI 功能返回降级提示，其余功能正常。

---

## 主要目录

```
backend/
  app/api/                  REST 接口（auth / community / upload / review / chat 等）
  app/models/models.py      数据模型（User / Post / Comment / Resource 等）
  app/services/
    course_assistant.py     课程知识库上下文组装
    community_ai.py         社区 AI 回复（三层上下文）
    resource_extractor.py   资源合规检查 + PDF OCR
    llm_service.py          LLM 调用封装（重试 / 并发控制）
    email_service.py        邮件验证码发送
  data/                     课程图谱种子数据
  uploads/                  用户上传文件存储目录

frontend/
  src/pages/
    AIChatPage.tsx          AI 课程助手（SSE 流式聊天）
    CommunityPage.tsx       社区帖子列表 + 发帖
    PostDetailPage.tsx      帖子详情 + 评论
    AdminReviewPage.tsx     管理员资源审核
    CourseDetailPage.tsx    课程详情页
  src/components/
    Layout/AppLayout.tsx    全局布局 + 导航
  src/contexts/AuthContext.tsx  JWT 鉴权上下文
  src/services/
    communityApi.ts         社区相关 API 客户端
    authApi.ts              登录注册 API 客户端

ai_material_pipeline/
  outputs/                  AI 整理后的课程 JSON（*.from_chapters.json）
```

---

## 主要接口

```
GET  /health
GET  /api/course-nodes
GET  /api/community/posts          需登录
POST /api/community/posts          需登录
POST /api/community/posts/{id}/comments  需登录
GET  /api/resources/pending        需 admin
POST /api/upload                   需登录
POST /api/chat/stream              SSE 流式
POST /api/auth/register
POST /api/auth/login
```

---

## 部署

服务器：Ubuntu 24.04，Nginx 反向代理，Let's Encrypt SSL，systemd 托管后端进程。

```bash
# 后端服务
systemctl status zhinan-backend

# 前端构建
cd frontend && npm run build
# dist/ 由 Nginx 直接托管
```
