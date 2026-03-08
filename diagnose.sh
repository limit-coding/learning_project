#!/bin/bash

echo "🔍 AI学习指导系统 - 诊断工具"
echo "================================"
echo ""

# 检查后端
echo "1️⃣ 检查后端服务 (端口 8000)..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ 后端运行正常"
    curl -s http://localhost:8000/health
else
    echo "   ❌ 后端未运行"
    echo "   💡 启动命令："
    echo "      cd backend && source venv/bin/activate && python -m app.main"
fi
echo ""

# 检查前端
echo "2️⃣ 检查前端服务 (端口 5173)..."
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo "   ✅ 前端运行正常"
else
    echo "   ❌ 前端未运行"
    echo "   💡 启动命令："
    echo "      cd frontend && npm run dev"
fi
echo ""

# 检查数据库
echo "3️⃣ 检查数据库..."
if [ -f "backend/zhinan.db" ]; then
    echo "   ✅ 数据库文件存在"
    cd backend
    source venv/bin/activate
    COURSE_COUNT=$(python -c "
from app.database import SessionLocal
from app.models.models import Course
db = SessionLocal()
print(db.query(Course).count())
db.close()
" 2>/dev/null)
    cd ..
    echo "   📊 课程数量: $COURSE_COUNT"
else
    echo "   ❌ 数据库文件不存在"
    echo "   💡 初始化命令："
    echo "      cd backend && source venv/bin/activate && python scripts/init_db.py"
fi
echo ""

# 测试 API
echo "4️⃣ 测试 API 连接..."
TEST_RESULT=$(curl -s -X POST http://localhost:8000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "current_knowledge": {
      "programming_languages": ["Python"],
      "completed_courses": [],
      "skill_level": "beginner"
    },
    "learning_goals": {
      "target_skills": ["deep_learning"],
      "specific_topics": []
    },
    "career_direction": {
      "target_role": "测试用户",
      "preferred_language": "Python",
      "industry": "tech"
    }
  }' 2>&1 | grep -o '"id":[0-9]*')

if [ ! -z "$TEST_RESULT" ]; then
    echo "   ✅ API 测试成功"
    echo "   $TEST_RESULT"
else
    echo "   ❌ API 测试失败"
fi
echo ""

# 测试前端代理
echo "5️⃣ 测试前端代理..."
PROXY_RESULT=$(curl -s -X POST http://localhost:5173/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "current_knowledge": {
      "programming_languages": ["Python"],
      "completed_courses": [],
      "skill_level": "beginner"
    },
    "learning_goals": {
      "target_skills": ["deep_learning"],
      "specific_topics": []
    },
    "career_direction": {
      "target_role": "代理测试",
      "preferred_language": "Python",
      "industry": "tech"
    }
  }' 2>&1 | grep -o '"id":[0-9]*')

if [ ! -z "$PROXY_RESULT" ]; then
    echo "   ✅ 前端代理工作正常"
    echo "   $PROXY_RESULT"
else
    echo "   ❌ 前端代理失败"
fi
echo ""

echo "================================"
echo "📊 诊断完成"
echo ""
echo "💡 如果所有检查都通过，请："
echo "   1. 打开浏览器访问 http://localhost:5173"
echo "   2. 打开浏览器开发者工具 (F12)"
echo "   3. 切换到 Console 标签"
echo "   4. 尝试提交表单，查看错误信息"
echo ""
echo "📞 常见问题："
echo "   - 如果后端未运行: ./start.sh"
echo "   - 如果看到 CORS 错误: 重启后端"
echo "   - 如果看到网络错误: 检查防火墙"
