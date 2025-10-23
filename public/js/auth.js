'use strict';

// 用户认证管理类
export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.init();
  }

  // 初始化认证系统
  init() {
    // 只在登录页面绑定事件
    if (window.location.pathname.includes('login.html')) {
      this.bindEvents();
    }
    this.checkExistingSession();
  }

  // 绑定事件
  bindEvents() {
    // 标签页切换
    document.getElementById('loginTab').addEventListener('click', () => this.switchTab('login'));
    document.getElementById('registerTab').addEventListener('click', () => this.switchTab('register'));

    // 表单提交
    document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerFormElement').addEventListener('submit', (e) => this.handleRegister(e));

    // 输入验证
    this.bindInputValidation();
  }

  // 绑定输入验证
  bindInputValidation() {
    // 用户名验证
    document.getElementById('registerUsername').addEventListener('input', (e) => {
      this.validateUsername(e.target);
    });

    // 密码验证
    document.getElementById('registerPassword').addEventListener('input', (e) => {
      this.validatePassword(e.target);
    });

    // 确认密码验证
    document.getElementById('confirmPassword').addEventListener('input', (e) => {
      this.validateConfirmPassword(e.target);
    });

    // 邮箱验证
    document.getElementById('email').addEventListener('input', (e) => {
      this.validateEmail(e.target);
    });
  }

  // 切换标签页
  switchTab(tab) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');

    // 更新表单显示
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(tab + 'Form').classList.add('active');

    // 清空消息
    this.clearMessage();
  }

  // 处理登录
  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username').trim();
    const password = formData.get('password');

    if (!username || !password) {
      this.showMessage('请填写完整的登录信息', 'error');
      return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    this.setButtonLoading(button, true);

    try {
      // 模拟网络延迟
      await this.delay(1000);

      const user = this.authenticateUser(username, password);
      if (user) {
        this.loginUser(user);
        this.showMessage('登录成功！正在跳转...', 'success');
        
        // 延迟跳转到游戏页面
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        this.showMessage('用户名或密码错误', 'error');
      }
    } catch (error) {
      this.showMessage('登录失败，请重试', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // 处理注册
  async handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const email = formData.get('email').trim();

    // 验证表单
    if (!this.validateRegisterForm(username, password, confirmPassword, email)) {
      return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    this.setButtonLoading(button, true);

    try {
      // 模拟网络延迟
      await this.delay(1000);

      if (this.userExists(username)) {
        this.showMessage('用户名已存在', 'error');
        return;
      }

      const newUser = this.createUser(username, password, email);
      this.users.push(newUser);
      this.saveUsers();

      this.showMessage('注册成功！请登录', 'success');
      
      // 切换到登录标签页
      setTimeout(() => {
        this.switchTab('login');
        document.getElementById('loginUsername').value = username;
      }, 1500);

    } catch (error) {
      this.showMessage('注册失败，请重试', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // 验证注册表单
  validateRegisterForm(username, password, confirmPassword, email) {
    let isValid = true;

    // 验证用户名
    if (!this.validateUsername(document.getElementById('registerUsername'))) {
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

    // 验证邮箱（如果填写了）
    if (email && !this.validateEmail(document.getElementById('email'))) {
      isValid = false;
    }

    return isValid;
  }

  // 验证用户名
  validateUsername(input) {
    const username = input.value.trim();
    const minLength = 3;
    const maxLength = 20;
    const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;

    if (username.length < minLength) {
      this.setInputError(input, `用户名至少需要${minLength}个字符`);
      return false;
    }

    if (username.length > maxLength) {
      this.setInputError(input, `用户名不能超过${maxLength}个字符`);
      return false;
    }

    if (!usernameRegex.test(username)) {
      this.setInputError(input, '用户名只能包含字母、数字、下划线和中文');
      return false;
    }

    this.setInputValid(input);
    return true;
  }

  // 验证密码
  validatePassword(input) {
    const password = input.value;
    const minLength = 6;

    if (password.length < minLength) {
      this.setInputError(input, `密码至少需要${minLength}个字符`);
      return false;
    }

    this.setInputValid(input);
    return true;
  }

  // 验证确认密码
  validateConfirmPassword(input) {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = input.value;

    if (confirmPassword !== password) {
      this.setInputError(input, '两次输入的密码不一致');
      return false;
    }

    this.setInputValid(input);
    return true;
  }

  // 验证邮箱
  validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      this.setInputError(input, '请输入有效的邮箱地址');
      return false;
    }

    this.setInputValid(input);
    return true;
  }

  // 设置输入错误状态
  setInputError(input, message) {
    input.classList.remove('valid');
    input.classList.add('invalid');
    
    // 移除旧的错误文本
    const oldError = input.parentNode.querySelector('.error-text');
    if (oldError) {
      oldError.remove();
    }
    
    // 添加新的错误文本
    const errorText = document.createElement('div');
    errorText.className = 'error-text';
    errorText.textContent = message;
    input.parentNode.appendChild(errorText);
  }

  // 设置输入有效状态
  setInputValid(input) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    
    // 移除错误文本
    const errorText = input.parentNode.querySelector('.error-text');
    if (errorText) {
      errorText.remove();
    }
  }

  // 设置按钮加载状态
  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      button.dataset.originalText = button.textContent;
      button.textContent = '处理中...';
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
  }

  // 清空消息
  clearMessage() {
    const messageEl = document.getElementById('authMessage');
    messageEl.className = 'auth-message';
  }

  // 检查现有会话
  checkExistingSession() {
    // 只在登录页面检查会话并跳转
    if (window.location.pathname.includes('login.html')) {
      const session = localStorage.getItem('snakeGameSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          if (sessionData.expires > Date.now()) {
            // 会话有效，直接跳转到游戏页面
            window.location.href = 'index.html';
          } else {
            // 会话过期，清除
            localStorage.removeItem('snakeGameSession');
          }
        } catch (error) {
          localStorage.removeItem('snakeGameSession');
        }
      }
    }
  }

  // 认证用户
  authenticateUser(username, password) {
    const user = this.users.find(u => u.username === username);
    if (user && this.hashPassword(password) === user.password) {
      return user;
    }
    return null;
  }

  // 检查用户是否存在
  userExists(username) {
    return this.users.some(u => u.username === username);
  }

  // 创建新用户
  createUser(username, password, email = '') {
    return {
      id: Date.now().toString(),
      username,
      password: this.hashPassword(password),
      email,
      createdAt: new Date().toISOString(),
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0
    };
  }

  // 用户登录
  loginUser(user) {
    this.currentUser = user;
    
    // 创建会话
    const session = {
      userId: user.id,
      username: user.username,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时
    };
    
    localStorage.setItem('snakeGameSession', JSON.stringify(session));
  }

  // 用户登出
  logout() {
    this.currentUser = null;
    localStorage.removeItem('snakeGameSession');
  }

  // 获取当前用户
  getCurrentUser() {
    if (!this.currentUser) {
      const session = localStorage.getItem('snakeGameSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          if (sessionData.expires > Date.now()) {
            const user = this.users.find(u => u.id === sessionData.userId);
            if (user) {
              this.currentUser = user;
            }
          }
        } catch (error) {
          this.logout();
        }
      }
    }
    return this.currentUser;
  }

  // 更新用户数据
  updateUser(userData) {
    if (this.currentUser) {
      Object.assign(this.currentUser, userData);
      const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
      if (userIndex !== -1) {
        this.users[userIndex] = this.currentUser;
        this.saveUsers();
      }
    }
  }

  // 简单的密码哈希（实际项目中应使用更安全的方法）
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  // 加载用户数据
  loadUsers() {
    try {
      const users = localStorage.getItem('snakeGameUsers');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      return [];
    }
  }

  // 保存用户数据
  saveUsers() {
    localStorage.setItem('snakeGameUsers', JSON.stringify(this.users));
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 在登录页面初始化认证管理器
if (window.location.pathname.includes('login.html')) {
  const authManager = new AuthManager();
}
