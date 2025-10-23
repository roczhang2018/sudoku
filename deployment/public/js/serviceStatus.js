'use strict';

import { ApiClient } from './api.js';

/**
 * 服务状态管理器
 * 负责检查后端服务状态并更新UI
 */
export class ServiceStatusManager {
  constructor() {
    this.apiClient = new ApiClient();
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusText = document.getElementById('statusText');
    this.refreshButton = document.getElementById('refreshService');
    this.isChecking = false;
    
    this.init();
  }

  /**
   * 初始化服务状态管理器
   */
  init() {
    console.log('ServiceStatusManager 初始化中...');
    console.log('刷新按钮元素:', this.refreshButton);
    
    // 绑定刷新按钮事件
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => {
        console.log('刷新按钮被点击');
        this.checkServiceStatus();
      });
      console.log('✅ 刷新按钮事件绑定成功');
    } else {
      console.error('❌ 找不到刷新按钮元素 (id: refreshService)');
    }

    // 页面加载时自动检查服务状态
    this.checkServiceStatus();

    // 定期检查服务状态（每30秒）
    setInterval(() => {
      if (!this.isChecking) {
        this.checkServiceStatus(true); // 静默检查
      }
    }, 30000);
  }

  /**
   * 检查服务状态
   * @param {boolean} silent - 是否静默检查（不显示加载状态）
   */
  async checkServiceStatus(silent = false) {
    console.log('开始检查服务状态, silent:', silent);
    
    if (this.isChecking) {
      console.log('正在检查中，跳过本次检查');
      return;
    }
    
    this.isChecking = true;
    
    if (!silent) {
      this.setStatus('checking', '检查服务状态...');
      this.setButtonLoading(true);
    }

    try {
      console.log('调用后端健康检查API...');
      // 尝试调用后端健康检查API
      const response = await this.apiClient.checkHealth();
      console.log('后端响应:', response);
      
      if (response && (response.status === 'ok' || response.status === 'healthy')) {
        this.setStatus('online', '后端服务正常');
        console.log('✅ 后端服务状态正常');
      } else {
        this.setStatus('offline', '后端服务异常');
        console.warn('⚠️ 后端服务响应异常:', response);
      }
    } catch (error) {
      this.setStatus('offline', '后端服务离线');
      console.error('❌ 后端服务检查失败:', error);
    } finally {
      this.isChecking = false;
      if (!silent) {
        this.setButtonLoading(false);
      }
    }
  }

  /**
   * 设置服务状态显示
   * @param {string} status - 状态类型: 'online', 'offline', 'checking'
   * @param {string} text - 状态文本
   */
  setStatus(status, text) {
    if (this.statusIndicator) {
      // 移除所有状态类
      this.statusIndicator.classList.remove('online', 'offline', 'checking');
      // 添加当前状态类
      this.statusIndicator.classList.add(status);
    }

    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  /**
   * 设置按钮加载状态
   * @param {boolean} loading - 是否显示加载状态
   */
  setButtonLoading(loading) {
    if (this.refreshButton) {
      this.refreshButton.disabled = loading;
      if (loading) {
        this.refreshButton.innerHTML = '🔄 检查中...';
      } else {
        this.refreshButton.innerHTML = '🔄 服务状态';
      }
    }
  }

  /**
   * 获取当前服务状态
   * @returns {Promise<Object>} 服务状态信息
   */
  async getServiceInfo() {
    try {
      const response = await this.apiClient.checkHealth();
      return {
        status: 'online',
        data: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 显示详细的服务信息
   */
  async showServiceDetails() {
    const info = await this.getServiceInfo();
    
    const details = `
服务状态详情:
• 状态: ${info.status === 'online' ? '✅ 在线' : '❌ 离线'}
• 检查时间: ${new Date(info.timestamp).toLocaleString()}
• 服务器响应: ${info.status === 'online' ? '正常' : '无响应'}
${info.data ? `• 服务信息: ${JSON.stringify(info.data, null, 2)}` : ''}
${info.error ? `• 错误信息: ${info.error}` : ''}
    `;
    
    alert(details);
  }
}

// 注意：ServiceStatusManager 在 main.js 中手动初始化
