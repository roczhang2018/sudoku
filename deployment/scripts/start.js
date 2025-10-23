#!/usr/bin/env node

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServiceManager {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.pidFile = path.join(this.projectRoot, 'snake-game.pid');
    this.logFile = path.join(this.projectRoot, 'logs', 'service.log');
  }

  /**
   * 启动服务
   */
  start() {
    console.log('🚀 启动贪吃蛇游戏服务...');
    
    // 检查是否已经在运行
    if (this.isRunning()) {
      console.log('⚠️  服务已经在运行中');
      return;
    }
    
    // 检查环境
    this.checkEnvironment();
    
    // 创建必要目录
    this.createDirectories();
    
    // 启动服务
    this.startService();
  }

  /**
   * 停止服务
   */
  stop() {
    console.log('🛑 停止贪吃蛇游戏服务...');
    
    if (!this.isRunning()) {
      console.log('⚠️  服务未在运行');
      return;
    }
    
    const pid = this.getPid();
    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');
        console.log(`✅ 服务已停止 (PID: ${pid})`);
        this.removePidFile();
      } catch (error) {
        console.log('❌ 停止服务失败:', error.message);
      }
    }
  }

  /**
   * 重启服务
   */
  restart() {
    console.log('🔄 重启贪吃蛇游戏服务...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 2000);
  }

  /**
   * 检查服务状态
   */
  status() {
    if (this.isRunning()) {
      const pid = this.getPid();
      console.log(`✅ 服务正在运行 (PID: ${pid})`);
      console.log(`🌐 访问地址: http://localhost:${process.env.PORT || 80}`);
    } else {
      console.log('❌ 服务未在运行');
    }
  }

  /**
   * 检查环境
   */
  checkEnvironment() {
    console.log('🔍 检查运行环境...');
    
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
      'server.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`必要文件不存在: ${file}`);
      }
    }
    
    console.log('✅ 环境检查通过');
  }

  /**
   * 创建必要目录
   */
  createDirectories() {
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
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  /**
   * 启动服务
   */
  startService() {
    const serverPath = path.join(this.projectRoot, 'server.js');
    
    // 设置环境变量
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || 80,
      HOST: process.env.HOST || '0.0.0.0'
    };
    
    // 启动服务进程
    const child = spawn('node', [serverPath], {
      cwd: this.projectRoot,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });
    
    // 保存PID
    this.savePid(child.pid);
    
    // 处理输出
    child.stdout.on('data', (data) => {
      console.log(data.toString());
      this.log(data.toString());
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
      this.log(data.toString());
    });
    
    // 处理进程退出
    child.on('exit', (code) => {
      console.log(`服务进程退出，代码: ${code}`);
      this.removePidFile();
    });
    
    // 分离进程
    child.unref();
    
    console.log(`✅ 服务已启动 (PID: ${child.pid})`);
    console.log(`🌐 访问地址: http://localhost:${env.PORT}`);
  }

  /**
   * 检查服务是否在运行
   */
  isRunning() {
    const pid = this.getPid();
    if (!pid) return false;
    
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      this.removePidFile();
      return false;
    }
  }

  /**
   * 获取PID
   */
  getPid() {
    if (!fs.existsSync(this.pidFile)) return null;
    
    try {
      return parseInt(fs.readFileSync(this.pidFile, 'utf8').trim());
    } catch (error) {
      return null;
    }
  }

  /**
   * 保存PID
   */
  savePid(pid) {
    fs.writeFileSync(this.pidFile, pid.toString());
  }

  /**
   * 删除PID文件
   */
  removePidFile() {
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
  }

  /**
   * 记录日志
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    try {
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error('日志写入失败:', error.message);
    }
  }
}

// 命令行接口
if (require.main === module) {
  const service = new ServiceManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      service.start();
      break;
    case 'stop':
      service.stop();
      break;
    case 'restart':
      service.restart();
      break;
    case 'status':
      service.status();
      break;
    default:
      console.log('用法: node start.js [start|stop|restart|status]');
      process.exit(1);
  }
}

module.exports = ServiceManager;
