#!/usr/bin/env node

'use strict';

const { spawn } = require('child_process');
const path = require('path');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('🚀 Starting Snake Game Backend Server...');
console.log(`📦 Node.js version: ${nodeVersion}`);
console.log(`📁 Working directory: ${process.cwd()}`);

// 启动服务器
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});

server.on('close', (code) => {
  console.log(`\n✅ Server exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
