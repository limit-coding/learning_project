# 快速启动指南

## 你需要做的事情

### 1. 安装依赖

#### 后端依赖
\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

#### 前端依赖
\`\`\`bash
cd frontend
npm install
\`\`\`

### 2. 配置数据库

#### 选项A：使用PostgreSQL（推荐）

1. 安装PostgreSQL
\`\`\`bash
# macOS
brew install postgresql
brew services start postgresql

# 创建数据库
createdb zhinan
\`\`\`

2. 配置环境变量
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

编辑 `.env` 文件：
\`\`\`env
DATABASE_URL=postgresql://你的用户名:你的密码@localhost:5432/zhinan
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
\`\`\`

#### 选项B：使用SQLite（简化版）

如果不想安装PostgreSQL，可以修改 `backend/app/config.py`：
\`\`\`python
database_url: str = "sqlite:///./zhinan.db"
\`\`\`

然后修改 `backend/requirements.txt`，移除 `psycopg2-binary`

### 3. 获取DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 创建API Key
4. 将API Key填入 `backend/.env` 文件

**注意**：如果暂时没有API Key，系统会使用模板化推荐理由（降级方案），不影响核心功能。

### 4. 初始化数据库

\`\`\`bash
cd backend
python scripts/init_db.py
\`\`\`

这会创建数据库表并导入20门深度学习课程。

### 5. 启动服务

#### 启动后端
\`\`\`bash
cd backend
python -m app.main
\`\`\`

后端运行在：http://localhost:8000
API文档：http://localhost:8000/docs

#### 启动前端（新终端）
\`\`\`bash
cd frontend
npm run dev
\`\`\`

前端运行在：http://localhost:5173

### 6. 测试系统

1. 打开浏览器访问 http://localhost:5173
2. 填写用户画像表单
3. 查看推荐结果

## 常见问题

### Q: 数据库连接失败
A: 检查PostgreSQL是否启动，数据库是否创建，`.env`中的连接字符串是否正确

### Q: DeepSeek API调用失败
A: 检查API Key是否正确，网络是否正常。系统会自动降级使用模板化推荐理由

### Q: 前端无法连接后端
A: 确保后端服务已启动在8000端口，检查浏览器控制台的错误信息

### Q: npm install失败
A: 尝试使用国内镜像：
\`\`\`bash
npm config set registry https://registry.npmmirror.com
npm install
\`\`\`

## 项目文件说明

### 后端核心文件
- `backend/app/main.py` - FastAPI应用入口
- `backend/app/services/recommendation_engine.py` - 推荐算法
- `backend/app/services/llm_service.py` - DeepSeek API集成
- `backend/app/api/routes.py` - API路由

### 前端核心文件
- `frontend/src/App.tsx` - 主应用
- `frontend/src/components/Profile/ProfileForm.tsx` - 用户画像表单
- `frontend/src/components/Recommendations/RecommendationList.tsx` - 推荐结果展示

### 数据文件
- `data/courses_seed.json` - 20门深度学习课程数据

## 下一步

系统已经可以运行了！你可以：

1. 测试不同的用户画像，看推荐结果是否合理
2. 根据需要调整推荐算法的权重（在 `recommendation_engine.py` 中）
3. 添加更多课程数据（编辑 `courses_seed.json`）
4. 优化前端UI
5. 添加更多功能（用户反馈、学习路径可视化等）

有问题随时问我！
