#!/bin/bash

# AI学习指导系统 - 启动脚本

echo "🚀 启动 AI学习指导系统..."
echo ""

# 检查后端虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "❌ 后端虚拟环境不存在，请先运行安装脚本"
    exit 1
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ 前端依赖未安装，请先运行安装脚本"
    exit 1
fi

# 启动后端
echo "📦 启动后端服务 (端口 8000)..."
cd backend
source venv/bin/activate
python -m app.main &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端服务 (端口 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 系统启动成功！"
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
