# 🤖 RAG 集成使用指南

## 📦 安装依赖

```bash

source venv/bin/activate
pip install -r requirements.txt
```

新增依赖：
- `sentence-transformers`: 本地向量模型
- `chromadb`: 向量数据库
- `numpy`: 数值计算

## 🚀 初始化向量数据库

```bash
cd /Users/limit/Desktop/zhinan/backend
python scripts/init_vector_db.py
```

这会：
1. 加载 20 门课程数据
2. 使用多语言模型生成向量嵌入
3. 存储到 ChromaDB（`backend/chroma_db/`）
4. 测试语义搜索功能

## ✨ RAG 增强效果

### 之前（无 RAG）
```
推荐理由：这是一门中级课程，涵盖深度学习、CNN等核心主题...
```

### 之后（有 RAG）
```
推荐理由：斯坦福CS230由Andrew Ng主讲，系统讲解CNN、RNN和优化算法，
非常适合你从Python基础进阶到深度学习工程师的目标。
```

## 🔧 工作原理

1. **向量化**: 课程描述 → 向量嵌入（768维）
2. **检索**: 根据课程代码检索详细上下文
3. **增强**: 将真实课程信息注入 LLM prompt
4. **生成**: DeepSeek 基于真实数据生成推荐理由

## 📊 技术栈

- **向量模型**: `paraphrase-multilingual-MiniLM-L12-v2`（支持中英文）
- **向量库**: ChromaDB（本地持久化）
- **LLM**: DeepSeek API

## 🎯 下一步扩展

1. **语义搜索 API**: 用户输入"我想学自动驾驶" → 智能匹配课程
2. **冷启动优化**: 用户信息少时，AI 自动补全画像
3. **学习路径**: AI 生成课程学习顺序

## ⚠️ 注意事项

- 首次运行会下载模型（约 120MB）
- 向量数据库存储在 `backend/chroma_db/`
- 如需重建索引，删除该目录后重新运行初始化脚本
