# AI学习指导系统

基于DeepSeek的个性化深度学习课程推荐系统

## 项目简介

这是一个AI驱动的学习指导网站，旨在解决互联网学习资源繁杂、缺乏个性化指导的问题。系统根据用户的当前知识基础、学习目标和职业方向，提供精准的深度学习课程推荐。

### 核心特性

- 🎯 **个性化推荐**：基于用户画像的智能课程匹配
- 🤖 **AI增强**：集成DeepSeek API生成个性化推荐理由
- 📊 **多维度评分**：编程语言、难度、领域、前置知识四维度匹配
- 🎓 **权威课程库**：精选20门顶级深度学习课程（Stanford、MIT、DeepLearning.AI等）

## 技术栈

### 后端
- **FastAPI** - 现代化Python Web框架
- **PostgreSQL** - 关系型数据库
- **SQLAlchemy** - ORM
- **DeepSeek API** - 大语言模型

### 前端
- **React 18** + **TypeScript**
- **Ant Design** - UI组件库
- **Vite** - 构建工具
- **Axios** - HTTP客户端

## 快速开始

### 前置要求

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### 1. 克隆项目

\`\`\`bash
cd /Users/limit/Desktop/zhinan
\`\`\`

### 2. 后端设置

\`\`\`bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库连接和DeepSeek API Key

# 初始化数据库
python scripts/init_db.py

# 启动后端服务
python -m app.main
# 或使用 uvicorn
uvicorn app.main:app --reload
\`\`\`

后端服务将运行在 http://localhost:8000

API文档：http://localhost:8000/docs

### 3. 前端设置

\`\`\`bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
\`\`\`

前端服务将运行在 http://localhost:5173

## 环境变量配置

### backend/.env

\`\`\`env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/zhinan

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_BASE=https://api.deepseek.com/v1

# 应用配置
SECRET_KEY=your-secret-key-here
DEBUG=True
\`\`\`

### 获取DeepSeek API Key

1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册并登录
3. 在控制台创建API Key
4. 将API Key填入 `.env` 文件

## 项目结构

\`\`\`
zhinan/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI应用入口
│   │   ├── config.py               # 配置管理
│   │   ├── database.py             # 数据库连接
│   │   ├── models/
│   │   │   └── models.py           # 数据模型
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic schemas
│   │   ├── api/
│   │   │   └── routes.py           # API路由
│   │   └── services/
│   │       ├── recommendation_engine.py  # 推荐引擎
│   │       └── llm_service.py            # DeepSeek集成
│   ├── scripts/
│   │   └── init_db.py              # 数据库初始化
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Profile/
│   │   │   │   └── ProfileForm.tsx       # 用户画像表单
│   │   │   └── Recommendations/
│   │   │       └── RecommendationList.tsx # 推荐结果展示
│   │   ├── services/
│   │   │   └── api.ts              # API调用
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript类型
│   │   └── App.tsx                 # 主应用
│   └── package.json
│
└── data/
    └── courses_seed.json           # 课程种子数据
\`\`\`

## 使用流程

1. **填写用户画像**
   - 选择已掌握的编程语言
   - 选择技能水平（初学者/中级/高级）
   - 填写已完成的课程（可选）

2. **设置学习目标**
   - 选择目标技能（深度学习、计算机视觉、NLP等）
   - 填写具体想学的主题（可选）

3. **确定职业方向**
   - 输入目标职位（如AI工程师）
   - 选择偏好的编程语言
   - 选择目标行业

4. **获取推荐**
   - 系统自动计算匹配分数
   - DeepSeek生成个性化推荐理由
   - 展示Top 5推荐课程

## 推荐算法

### 评分维度（总分100分）

1. **编程语言匹配（30分）**
   - 完全匹配：30分
   - 相似语言：15分
   - 不匹配：0分

2. **难度适配（25分）**
   - 完美匹配：25分
   - 略有挑战（+1级）：20分
   - 略简单（-1级）：15分

3. **领域相关度（25分）**
   - 使用Jaccard相似度计算

4. **前置知识满足度（20分）**
   - 按比例计算满足程度

### AI增强

- 对Top 10候选课程调用DeepSeek API
- 生成50-80字的个性化推荐理由
- 失败时使用模板化理由降级

## API文档

### 创建用户画像

\`\`\`http
POST /api/profiles
Content-Type: application/json

{
  "current_knowledge": {
    "programming_languages": ["Python"],
    "completed_courses": [],
    "skill_level": "beginner"
  },
  "learning_goals": {
    "target_skills": ["deep_learning", "computer_vision"],
    "specific_topics": ["CNN"]
  },
  "career_direction": {
    "target_role": "AI工程师",
    "preferred_language": "Python",
    "industry": "tech"
  }
}
\`\`\`

### 获取推荐

\`\`\`http
GET /api/recommendations/{profile_id}?top_n=5
\`\`\`

## 课程数据

系统包含20门精选深度学习课程，涵盖：

- **基础课程**：Deep Learning Specialization、MIT 6.S191
- **计算机视觉**：CS231n、YOLO、Stable Diffusion
- **自然语言处理**：CS224n、Transformers、LLM Bootcamp
- **强化学习**：David Silver RL、Deep RL (UC Berkeley)
- **生成式AI**：GANs、Diffusion Models
- **工程实践**：MLOps、PyTorch Lightning

## 开发计划

### MVP（已完成）
- ✅ 用户画像表单
- ✅ 推荐引擎核心算法
- ✅ DeepSeek API集成
- ✅ 推荐结果展示
- ✅ 20门课程种子数据

### 后续优化
- [ ] 用户反馈收集
- [ ] 推荐历史记录
- [ ] 课程详情页
- [ ] 学习路径可视化
- [ ] 协同过滤推荐

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系项目维护者。
\`\`\`

这个README提供了完整的项目说明、安装指南和使用文档。
