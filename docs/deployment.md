# 🚀 贪吃蛇游戏部署指南

## 📋 部署概览

本指南提供了贪吃蛇游戏的最简便部署方案，使用Node.js统一服务架构，最少依赖，配置简单。

### 🏗️ 架构说明

```
用户请求 → Node.js(80) → 内部路由分发
├── 静态文件 (HTML, CSS, JS)
├── API请求 (/api/*)
└── WebSocket (/socket.io/*)
```

## 🎯 部署方式

### 方式一：自动部署 (推荐)

#### 1. 准备部署
```bash
# 进入项目目录
cd /path/to/snake-game

# 运行部署脚本
npm run deploy
```

#### 2. 上传到服务器
```bash
# 将生成的部署包上传到服务器
scp snake-game-2024-01-01.tar.gz user@server:/tmp/

# 在服务器上解压
ssh user@server
cd /opt
tar -xzf /tmp/snake-game-2024-01-01.tar.gz
mv deployment snake-game
cd snake-game
```

#### 3. 启动服务
```bash
# 使用启动脚本
./start.sh

# 或使用Node.js启动
node server.js
```

### 方式二：手动部署

#### 1. 服务器准备
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2. 上传代码
```bash
# 上传项目文件到服务器
scp -r /path/to/snake-game user@server:/opt/
```

#### 3. 安装依赖
```bash
# 进入项目目录
cd /opt/snake-game

# 安装生产依赖
npm ci --production
```

#### 4. 创建必要目录
```bash
mkdir -p data/users data/games data/sessions data/records logs backups
```

#### 5. 启动服务
```bash
# 设置环境变量
export NODE_ENV=production
export PORT=80
export HOST=0.0.0.0

# 启动服务
node server.js
```

## 🔧 配置说明

### 环境变量配置

复制 `env.example` 为 `.env` 文件：
```bash
# 环境配置
NODE_ENV=production
PORT=80
HOST=0.0.0.0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS配置
CORS_ORIGIN=*

# 日志配置
LOG_LEVEL=info
```

### 生产环境配置

修改 `config/production.json`：
```json
{
  "server": {
    "port": 80,
    "host": "0.0.0.0"
  },
  "jwt": {
    "secret": "production-jwt-secret-key",
    "expiresIn": "24h"
  },
  "cors": {
    "origin": ["https://your-domain.com"],
    "credentials": true
  }
}
```

## 🚀 服务管理

### 使用启动脚本

```bash
# 启动服务
npm run service:start

# 停止服务
npm run service:stop

# 重启服务
npm run service:restart

# 查看状态
npm run service:status
```

### 使用PM2 (推荐生产环境)

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "snake-game"

# 查看状态
pm2 status

# 查看日志
pm2 logs snake-game

# 重启服务
pm2 restart snake-game

# 停止服务
pm2 stop snake-game

# 设置开机自启
pm2 startup
pm2 save
```

## 📊 监控和维护

### 日志管理

```bash
# 查看应用日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 查看服务日志
tail -f logs/service.log
```

### 数据备份

```bash
# 手动备份
npm run backup

# 设置定时备份
crontab -e
# 添加以下行：
# 0 2 * * * cd /opt/snake-game && npm run backup
```

### 性能监控

```bash
# 检查服务状态
curl http://localhost/health

# 检查端口占用
lsof -i :80

# 检查进程状态
ps aux | grep node
```

## 🔒 安全配置

### 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# 启用防火墙
sudo ufw enable
```

### SSL证书配置

```bash
# 安装certbot
sudo apt install certbot

# 申请证书
sudo certbot certonly --standalone -d your-domain.com

# 配置HTTPS (需要修改server.js支持HTTPS)
```

## 🆘 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :80
   
   # 杀死占用进程
   sudo kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   # 设置文件权限
   chmod +x start.sh
   chmod -R 755 data/
   ```

3. **依赖问题**
   ```bash
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

### 日志分析

```bash
# 查看错误日志
grep "ERROR" logs/combined.log

# 查看访问日志
grep "GET\|POST" logs/combined.log

# 查看WebSocket连接
grep "socket" logs/combined.log
```

## 📈 性能优化

### 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
sysctl -p
```

### 应用优化

```bash
# 使用PM2集群模式
pm2 start server.js -i max --name "snake-game"

# 启用Gzip压缩 (在server.js中配置)
# 设置静态文件缓存
# 配置连接池
```

## 📞 技术支持

如遇到部署问题：
1. 查看日志文件
2. 检查配置文件
3. 验证网络连接
4. 提交GitHub Issue

---

**注意**: 本部署方案适用于小型到中型应用，如需高可用性，建议使用负载均衡和数据库集群。
