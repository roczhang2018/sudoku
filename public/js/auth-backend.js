'use strict';

import { ApiClient } from './api.js';

/**
 * 后端集成的用户认证管理类
 */
export class BackendAuthManager {
  constructor() {
    this.currentUser = null;
    this.apiClient = new ApiClient();
    this.isBackendAvailable = false;
    this.init();
  }

  /**
   * 初始化认证系统
   */
  async init() {
    // 检查后端服务器是否可用
    await this.checkBackendAvailability();
    
    // 只在登录页面绑定事件
    if (window.location.pathname.includes('login.html')) {
      this.bindEvents();
    }
    
    // 检查现有会话
    await this.checkExistingSession();
  }

  /**
   * 检查后端服务器可用性
   */
  async checkBackendAvailability() {
    try {
      await this.apiClient.checkHealth();
      this.isBackendAvailable = true;
      console.log('Backend server is available');
    } catch (error) {
      this.isBackendAvailable = false;
      console.warn('Backend server is not available, falling back to local storage');
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 标签页切换
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab) {
      loginTab.addEventListener('click', () => this.switchTab('login'));
    }
    if (registerTab) {
      registerTab.addEventListener('click', () => this.switchTab('register'));
    }

    // 表单提交
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // 输入验证
    this.bindInputValidation();
  }

  /**
   * 绑定输入验证
   */
  bindInputValidation() {
    // 用户名验证
    const registerUsername = document.getElementById('registerUsername');
    if (registerUsername) {
      registerUsername.addEventListener('input', (e) => {
        this.validateUsername(e.target);
      });
    }

    // 密码验证
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
      registerPassword.addEventListener('input', (e) => {
        this.validatePassword(e.target);
      });
    }

    // 确认密码验证
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
      confirmPassword.addEventListener('input', (e) => {
        this.validateConfirmPassword(e.target);
      });
    }

    // 邮箱验证
    const registerEmail = document.getElementById('registerEmail');
    if (registerEmail) {
      registerEmail.addEventListener('input', (e) => {
        this.validateEmail(e.target);
      });
    }
  }

  /**
   * 切换标签页
   */
  switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
    } else {
      registerTab?.classList.add('active');
      loginTab?.classList.remove('active');
      registerForm?.classList.add('active');
      loginForm?.classList.remove('active');
    }

    this.clearMessages();
  }

  /**
   * 处理登录
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      this.showMessage('请填写用户名和密码', 'error');
      return;
    }

    try {
      this.showMessage('登录中...', 'info');
      
      if (this.isBackendAvailable) {
        // 使用后端API登录
        const response = await this.apiClient.login(username, password);
        this.currentUser = response.user;
        this.showMessage('登录成功！', 'success');
        
        // 延迟跳转
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        // 回退到本地存储登录
        const user = this.loginUserLocal(username, password);
        if (user) {
          this.currentUser = user;
          this.showMessage('登录成功！', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          this.showMessage('用户名或密码错误', 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage(error.message || '登录失败', 'error');
    }
  }

  /**
   * 处理注册
   */
  async handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证输入
    if (!this.validateRegisterForm(username, email, password, confirmPassword)) {
      return;
    }

    try {
      this.showMessage('注册中...', 'info');
      
      if (this.isBackendAvailable) {
        // 使用后端API注册
        const response = await this.apiClient.register(username, email, password);
        this.currentUser = response.user;
        this.showMessage('注册成功！', 'success');
        
        // 延迟跳转
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        // 回退到本地存储注册
        const user = this.registerUserLocal(username, email, password);
        if (user) {
          this.currentUser = user;
          this.showMessage('注册成功！', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          this.showMessage('用户名已存在', 'error');
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showMessage(error.message || '注册失败', 'error');
    }
  }

  /**
   * 验证注册表单
   */
  validateRegisterForm(username, email, password, confirmPassword) {
    let isValid = true;

    // 验证用户名
    if (!this.validateUsername(document.getElementById('registerUsername'))) {
      isValid = false;
    }

    // 验证邮箱
    if (!this.validateEmail(document.getElementById('registerEmail'))) {
      isValid = false;
    }

    // 验证密码
    if (!this.validatePassword(document.getElementById('registerPassword'))) {
      isValid = false;
    }

    // 验证确认密码
    if (!this.validateConfirmPassword(document.getElementById('confirmPassword'))) {
      isValid = false;
    }

    return isValid;
  }

  /**
   * 验证用户名
   */
  validateUsername(input) {
    const username = input.value.trim();
    const errorElement = input.parentNode.querySelector('.error-message');
    
    if (!username) {
      this.showFieldError(errorElement, '请输入用户名');
      return false;
    }
    
    if (username.length < 3) {
      this.showFieldError(errorElement, '用户名至少3个字符');
      return false;
    }
    
    if (username.length > 30) {
      this.showFieldError(errorElement, '用户名不能超过30个字符');
      return false;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      this.showFieldError(errorElement, '用户名只能包含字母和数字');
      return false;
    }
    
    this.clearFieldError(errorElement);
    return true;
  }

  /**
   * 验证邮箱
   */
  validateEmail(input) {
    const email = input.value.trim();
    const errorElement = input.parentNode.querySelector('.error-message');
    
    if (!email) {
      this.showFieldError(errorElement, '请输入邮箱');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showFieldError(errorElement, '请输入有效的邮箱地址');
      return false;
    }
    
    this.clearFieldError(errorElement);
    return true;
  }

  /**
   * 验证密码
   */
  validatePassword(input) {
    const password = input.value;
    const errorElement = input.parentNode.querySelector('.error-message');
    
    if (!password) {
      this.showFieldError(errorElement, '请输入密码');
      return false;
    }
    
    if (password.length < 6) {
      this.showFieldError(errorElement, '密码至少6个字符');
      return false;
    }
    
    if (password.length > 100) {
      this.showFieldError(errorElement, '密码不能超过100个字符');
      return false;
    }
    
    this.clearFieldError(errorElement);
    return true;
  }

  /**
   * 验证确认密码
   */
  validateConfirmPassword(input) {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = input.value;
    const errorElement = input.parentNode.querySelector('.error-message');
    
    if (!confirmPassword) {
      this.showFieldError(errorElement, '请确认密码');
      return false;
    }
    
    if (password !== confirmPassword) {
      this.showFieldError(errorElement, '两次输入的密码不一致');
      return false;
    }
    
    this.clearFieldError(errorElement);
    return true;
  }

  /**
   * 显示字段错误
   */
  showFieldError(errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * 清除字段错误
   */
  clearFieldError(errorElement) {
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  /**
   * 显示消息
   */
  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `auth-message ${type}`;
      messageEl.style.display = 'block';
    }
  }

  /**
   * 清除消息
   */
  clearMessages() {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.style.display = 'none';
    }
  }

  /**
   * 检查现有会话
   */
  async checkExistingSession() {
    try {
      if (this.isBackendAvailable && this.apiClient.isAuthenticated()) {
        // 验证后端token
        const response = await this.apiClient.verifyToken();
        this.currentUser = response.user;
        
        // 如果在登录页面，跳转到主页
        if (window.location.pathname.includes('login.html')) {
          window.location.href = 'index.html';
        }
      } else {
        // 回退到本地存储检查
        const session = localStorage.getItem('snakeGameSession');
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            if (sessionData.expires > Date.now()) {
              const users = this.loadUsersLocal();
              const user = users.find(u => u.id === sessionData.userId);
              if (user) {
                this.currentUser = user;
                if (window.location.pathname.includes('login.html')) {
                  window.location.href = 'index.html';
                }
              } else {
                this.logout();
              }
            } else {
              this.logout();
            }
          } catch (error) {
            this.logout();
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      this.logout();
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 更新用户数据
   */
  async updateUser(updates) {
    try {
      if (this.isBackendAvailable && this.apiClient.isAuthenticated()) {
        const response = await this.apiClient.updateUserProfile(updates);
        this.currentUser = response.user;
        return response.user;
      } else {
        // 回退到本地存储更新
        return this.updateUserLocal(updates);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      if (this.isBackendAvailable && this.apiClient.isAuthenticated()) {
        await this.apiClient.logout();
      } else {
        // 清除本地存储
        localStorage.removeItem('snakeGameSession');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
    }
  }

  /**
   * 检查后端是否可用
   */
  isBackendAvailable() {
    return this.isBackendAvailable;
  }

  /**
   * 获取API客户端
   */
  getApiClient() {
    return this.apiClient;
  }

  // ==================== 本地存储回退方法 ====================

  /**
   * 本地存储用户登录
   */
  loginUserLocal(username, password) {
    const users = this.loadUsersLocal();
    const user = users.find(u => u.username === username);
    
    if (user && this.hashPassword(password) === user.passwordHash) {
      // 创建会话
      const session = {
        userId: user.id,
        username: user.username,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时
      };
      
      localStorage.setItem('snakeGameSession', JSON.stringify(session));
      return user;
    }
    
    return null;
  }

  /**
   * 本地存储用户注册
   */
  registerUserLocal(username, email, password) {
    const users = this.loadUsersLocal();
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return null;
    }
    
    const user = {
      id: Date.now().toString(),
      username,
      email,
      passwordHash: this.hashPassword(password),
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    localStorage.setItem('snakeGameUsers', JSON.stringify(users));
    
    // 创建会话
    const session = {
      userId: user.id,
      username: user.username,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时
    };
    
    localStorage.setItem('snakeGameSession', JSON.stringify(session));
    return user;
  }

  /**
   * 本地存储更新用户
   */
  updateUserLocal(updates) {
    if (!this.currentUser) return null;
    
    const users = this.loadUsersLocal();
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem('snakeGameUsers', JSON.stringify(users));
      this.currentUser = users[userIndex];
      return this.currentUser;
    }
    
    return null;
  }

  /**
   * 加载本地用户数据
   */
  loadUsersLocal() {
    try {
      const users = localStorage.getItem('snakeGameUsers');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 简单密码哈希
   */
  hashPassword(password) {
    // 简单的哈希实现，实际应用中应使用更安全的方法
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }
}

// 初始化后端认证管理器
const authManager = new BackendAuthManager();
