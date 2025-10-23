#!/bin/bash

# 贪吃蛇游戏启动脚本
# 生成时间: 2025-10-23T09:58:55.285Z

set -e

echo "🚀 启动贪吃蛇游戏服务..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18+，当前版本: $(node --version)"
    exit 1
fi

# 设置环境变量
export NODE_ENV=production
export PORT=80
export HOST=0.0.0.0

# 检查端口是否被占用
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口80已被占用，尝试使用端口3000"
    export PORT=3000
fi

# 创建必要目录
mkdir -p data/users data/games data/sessions data/records logs backups

# 启动服务
echo "🎮 启动游戏服务在端口 $PORT..."
node server.js

echo "✅ 服务启动完成！"
echo "🌐 访问地址: http://localhost:$PORT"
