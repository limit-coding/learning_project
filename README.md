# 知南：北邮课程路线系统

知南是一个面向北邮课程学习的资料整理与 AI 助手系统。项目当前聚焦三件事：

1. 按学院、年级、学期整理课程资料。
2. 展示单课程知识图谱、章节重点、学习路线和公开资料。
3. 提供 AI 课程助手，根据已整理的课程 JSON 回答课程内容、考试重点、学习建议等问题。

旧版本中的用户画像推荐、课程匹配评分和实验性检索链路已经移除，当前版本不再维护这些接口和文档。

## 功能

- 课程入口：按学院、学期、课程切换。
- 单课程知识图谱：展示课程主干知识点和子节点。
- 课程详情：展示章节重点、学习要求、复习要点、学习资源。
- AI 课程助手：读取 `ai_material_pipeline/outputs/*.from_chapters.json` 中的课程资料，组装上下文后调用 LLM 回答。
- 课程图谱接口：保留后端课程节点、前置关系、资源卡片和学习路径接口，便于后续扩展。
- 资源审核接口：保留管理员维护人工整理资源的后端能力。

## 技术栈

- 前端：React + TypeScript + Vite + Ant Design
- 后端：FastAPI + SQLAlchemy
- 数据库：开发环境可用 SQLite，部署环境可用 PostgreSQL
- AI：兼容 DeepSeek、OpenAI 或自定义 OpenAI-compatible API

## 本地启动

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

后端健康检查：

```bash
curl http://localhost:8000/health
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

打开：

```text
http://localhost:5173
```

## AI 配置

后端读取 `backend/.env`。可以参考 `backend/.env.example`：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=your_api_key_here
LLM_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
```

如果没有配置 API Key，页面仍可展示课程资料，但 AI 助手会返回降级提示。

## 主要目录

```text
backend/
  app/api/              后端接口
  app/models/           数据模型
  app/schemas/          请求/响应结构
  app/services/         LLM、搜索等服务
  data/                 课程图谱和资源种子数据
  scripts/init_db.py    数据库初始化脚本

frontend/
  src/App.tsx           主界面
  src/components/Chat/  AI 课程助手
  src/data/             前端课程资料聚合
  src/services/api.ts   后端 API 客户端

ai_material_pipeline/
  outputs/              AI 辅助整理后的课程 JSON
  scripts/              课程资料转换和校验脚本
```

## 常用接口

- `GET /health`
- `GET /api/course-nodes`
- `GET /api/course-edges`
- `GET /api/resources`
- `POST /api/roadmaps/generate`
- `POST /api/chat`

## 部署

当前线上域名：

```text
https://learnpath.tech
```

线上部署记录保留在 `docs/deploy-log-learnpath-tech.md`。
