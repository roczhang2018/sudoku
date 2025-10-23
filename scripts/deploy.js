#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.deploymentDir = path.join(this.projectRoot, 'deployment');
  }

  /**
   * 执行部署
   */
  async deploy() {
    console.log('🚀 开始部署贪吃蛇游戏...');
    
    try {
      // 1. 检查环境
      this.checkEnvironment();
      
      // 2. 创建部署目录
      this.createDeploymentDirectory();
      
      // 3. 复制必要文件
      this.copyFiles();
      
      // 4. 安装依赖
      this.installDependencies();
      
      // 5. 创建必要目录
      this.createDirectories();
      
      // 6. 设置权限
      this.setPermissions();
      
      // 7. 生成启动脚本
      this.generateStartScript();
      
      // 8. 生成部署包
      this.createDeploymentPackage();
      
      console.log('✅ 部署准备完成！');
      console.log('📦 部署包位置:', this.deploymentDir);
      console.log('🚀 运行以下命令启动服务:');
      console.log('   cd deployment && ./start.sh');
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查环境
   */
  checkEnvironment() {
    console.log('🔍 检查部署环境...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js版本过低，需要18+，当前版本: ${nodeVersion}`);
    }
    
    console.log(`✅ Node.js版本: ${nodeVersion}`);
    
    // 检查必要文件
    const requiredFiles = [
      'package.json',
      'server.js',
      'public/index.html'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`必要文件不存在: ${file}`);
      }
    }
    
    console.log('✅ 必要文件检查通过');
  }

  /**
   * 创建部署目录
   */
  createDeploymentDirectory() {
    console.log('📁 创建部署目录...');
    
    if (fs.existsSync(this.deploymentDir)) {
      fs.rmSync(this.deploymentDir, { recursive: true });
    }
    
    fs.mkdirSync(this.deploymentDir, { recursive: true });
    console.log('✅ 部署目录创建完成');
  }

  /**
   * 复制文件
   */
  copyFiles() {
    console.log('📋 复制项目文件...');
    
    const filesToCopy = [
      'package.json',
      'package-lock.json',
      'server.js',
      'env.example',
      'public/',
      'src/',
      'config/',
      'scripts/'
    ];
    
    for (const item of filesToCopy) {
      const srcPath = path.join(this.projectRoot, item);
      const destPath = path.join(this.deploymentDir, item);
      
      if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
          this.copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
        console.log(`  ✅ 复制: ${item}`);
      } else {
        console.log(`  ⚠️  跳过: ${item} (不存在)`);
      }
    }
  }

  /**
   * 复制目录
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 安装依赖
   */
  installDependencies() {
    console.log('📦 安装生产依赖...');
    
    try {
      execSync('npm ci --production', {
        cwd: this.deploymentDir,
        stdio: 'inherit'
      });
      console.log('✅ 依赖安装完成');
    } catch (error) {
      throw new Error('依赖安装失败: ' + error.message);
    }
  }

  /**
   * 创建必要目录
   */
  createDirectories() {
    console.log('📁 创建必要目录...');
    
    const directories = [
      'data',
      'data/users',
      'data/games',
      'data/sessions',
      'data/records',
      'logs',
      'backups'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(this.deploymentDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ 创建目录: ${dir}`);
      }
    }
  }

  /**
   * 设置权限
   */
  setPermissions() {
    console.log('🔐 设置文件权限...');
    
    try {
      // 设置启动脚本执行权限
      const startScriptPath = path.join(this.deploymentDir, 'start.sh');
      if (fs.existsSync(startScriptPath)) {
        fs.chmodSync(startScriptPath, '755');
        console.log('✅ 启动脚本权限设置完成');
      }
    } catch (error) {
      console.log('⚠️  权限设置失败:', error.message);
    }
  }

  /**
   * 生成启动脚本
   */
  generateStartScript() {
    console.log('📝 生成启动脚本...');
    
    const startScript = `#!/bin/bash

# 贪吃蛇游戏启动脚本
# 生成时间: ${new Date().toISOString()}

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
`;

    const startScriptPath = path.join(this.deploymentDir, 'start.sh');
    fs.writeFileSync(startScriptPath, startScript);
    fs.chmodSync(startScriptPath, '755');
    
    console.log('✅ 启动脚本生成完成');
  }

  /**
   * 创建部署包
   */
  createDeploymentPackage() {
    console.log('📦 创建部署包...');
    
    const packageName = `snake-game-${new Date().toISOString().split('T')[0]}.tar.gz`;
    const packagePath = path.join(this.projectRoot, packageName);
    
    try {
      execSync(`tar -czf "${packagePath}" -C "${this.projectRoot}" deployment/`, {
        stdio: 'inherit'
      });
      console.log(`✅ 部署包创建完成: ${packageName}`);
    } catch (error) {
      console.log('⚠️  部署包创建失败:', error.message);
    }
  }
}

// 执行部署
if (require.main === module) {
  const deployer = new DeploymentManager();
  deployer.deploy().catch(console.error);
}

module.exports = DeploymentManager;
