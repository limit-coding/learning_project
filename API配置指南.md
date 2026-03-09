# 🔑 多模型 API 配置指南

## 📝 如何添加你的 DeepSeek API Key

打开 `/Users/limit/Desktop/zhinan/backend/.env` 文件，修改以下配置：

```bash
# LLM API 配置
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-xxxxxxxxxxxxxxxx  # 👈 在这里填入你的 DeepSeek API Key
LLM_MODEL=deepseek-chat
```

## 🎯 支持的模型提供商

### 1. DeepSeek（推荐）

```bash
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-your-deepseek-key
LLM_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
```

**获取 API Key**: https://platform.deepseek.com/

### 2. OpenAI

```bash
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-openai-key
LLM_MODEL=gpt-4
OPENAI_API_BASE=https://api.openai.com/v1
```

### 3. 自定义（兼容 OpenAI 格式的 API）

```bash
LLM_PROVIDER=custom
LLM_API_KEY=your-custom-key
LLM_MODEL=your-model-name
CUSTOM_API_BASE=https://your-api-endpoint.com/v1
```

支持的自定义 API：
- 通义千问（Qwen）
- 智谱 AI（GLM）
- 月之暗面（Kimi）
- 其他兼容 OpenAI 格式的 API

## 🚀 快速开始

1. **编辑配置文件**
```bash
cd /Users/limit/Desktop/zhinan/backend
nano .env  # 或使用任何文本编辑器
```

2. **填入你的 API Key**
```bash
LLM_API_KEY=sk-your-actual-key-here
```

3. **重启后端服务**
```bash
source venv/bin/activate
python -m app.main
```

## ✅ 测试 API 是否生效

访问 http://localhost:8000/docs，测试推荐接口，查看是否返回 AI 生成的推荐理由。

## 💡 没有 API Key？

不用担心！系统会自动降级使用模板化推荐理由，功能完全正常。

## 🔧 切换模型

只需修改 `.env` 中的 `LLM_PROVIDER` 和相关配置，无需修改代码。
