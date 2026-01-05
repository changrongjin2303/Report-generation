#!/bin/bash

# 获取当前脚本所在目录
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# 定义清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    if [ -n "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi
    if [ -n "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null; fi
    exit
}

# 捕获 Ctrl+C 信号
trap cleanup INT TERM

echo "=========================================="
echo "   工程造价咨询报告生成系统 - 启动脚本"
echo "=========================================="

# 1. 启动后端
echo "🚀 [1/2] 正在启动后端 (FastAPI)..."
cd "$BASE_DIR"

# 检查端口 8000 是否被占用
if lsof -i :8000 >/dev/null; then
    echo "⚠️  端口 8000 已被占用，尝试清理..."
    lsof -ti :8000 | xargs kill -9
fi

# 启动后端并记录日志
python3 server.py > backend.log 2>&1 &
BACKEND_PID=$!

# 等待 2 秒检查是否存活
sleep 2
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ 后端启动失败！以下是错误日志："
    cat backend.log
    cleanup
fi
echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 2. 启动前端
echo "🚀 [2/2] 正在启动前端 (React/Vite)..."
cd "$BASE_DIR/frontend"

# 检查端口 5173 是否被占用
if lsof -i :5173 >/dev/null; then
    echo "⚠️  端口 5173 已被占用，尝试清理..."
    lsof -ti :5173 | xargs kill -9
fi

# 启动前端并记录日志
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待 3 秒检查是否存活
sleep 3
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "❌ 前端启动失败！以下是错误日志："
    cat ../frontend.log
    cleanup
fi
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"

echo "=========================================="
echo "🎉 系统启动成功！"
echo "👉 请在浏览器访问: http://localhost:5173"
echo "📝 后端日志查看: cat backend.log"
echo "📝 前端日志查看: cat frontend.log"
echo "💡 按 Ctrl + C 停止所有服务"
echo "=========================================="

# 保持脚本运行
wait
