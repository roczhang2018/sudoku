#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupManager {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.backupDir = path.join(this.projectRoot, 'backups');
    this.dataDir = path.join(this.projectRoot, 'data');
  }

  /**
   * 执行备份
   */
  async backup() {
    console.log('💾 开始备份数据...');
    
    try {
      // 创建备份目录
      this.createBackupDirectory();
      
      // 备份数据文件
      await this.backupData();
      
      // 备份配置文件
      await this.backupConfig();
      
      // 清理旧备份
      this.cleanupOldBackups();
      
      console.log('✅ 备份完成！');
      
    } catch (error) {
      console.error('❌ 备份失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 创建备份目录
   */
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 备份数据文件
   */
  async backupData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `data-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    if (fs.existsSync(this.dataDir)) {
      execSync(`tar -czf "${backupPath}.tar.gz" -C "${this.projectRoot}" data/`, {
        stdio: 'inherit'
      });
      console.log(`✅ 数据备份完成: ${backupName}.tar.gz`);
    } else {
      console.log('⚠️  数据目录不存在，跳过数据备份');
    }
  }

  /**
   * 备份配置文件
   */
  async backupConfig() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `config-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    const configFiles = [
      'package.json',
      'server.js',
      'env.example',
      'config/'
    ];
    
    const existingFiles = configFiles.filter(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );
    
    if (existingFiles.length > 0) {
      const tarCommand = `tar -czf "${backupPath}.tar.gz" -C "${this.projectRoot}" ${existingFiles.join(' ')}`;
      execSync(tarCommand, { stdio: 'inherit' });
      console.log(`✅ 配置备份完成: ${backupName}.tar.gz`);
    }
  }

  /**
   * 清理旧备份
   */
  cleanupOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const backupFiles = files.filter(file => file.endsWith('.tar.gz'));
    
    // 按修改时间排序
    backupFiles.sort((a, b) => {
      const aPath = path.join(this.backupDir, a);
      const bPath = path.join(this.backupDir, b);
      return fs.statSync(bPath).mtime - fs.statSync(aPath).mtime;
    });
    
    // 保留最近10个备份，删除其他
    const filesToDelete = backupFiles.slice(10);
    
    for (const file of filesToDelete) {
      const filePath = path.join(this.backupDir, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️  删除旧备份: ${file}`);
    }
    
    if (filesToDelete.length > 0) {
      console.log(`✅ 清理完成，删除了 ${filesToDelete.length} 个旧备份`);
    }
  }
}

// 执行备份
if (require.main === module) {
  const backup = new BackupManager();
  backup.backup().catch(console.error);
}

module.exports = BackupManager;
