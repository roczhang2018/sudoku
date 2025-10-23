#!/usr/bin/env node

'use strict';

const http = require('http');

/**
 * 简单的服务器测试脚本
 */
async function testServer() {
  const serverUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Snake Game Backend Server...\n');

  try {
    // 测试健康检查
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest(`${serverUrl}/health`);
    console.log('✅ Health check passed');
    console.log('   Status:', healthResponse.status);
    console.log('   Uptime:', healthResponse.uptime, 'seconds\n');

    // 测试用户注册
    console.log('2. Testing user registration...');
    const registerData = {
      username: 'testuser' + Date.now(),
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    const registerResponse = await makeRequest(`${serverUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    console.log('✅ User registration passed');
    console.log('   User ID:', registerResponse.user.id);
    console.log('   Token received:', !!registerResponse.token);
    
    const token = registerResponse.token;
    console.log('');

    // 测试token验证
    console.log('3. Testing token verification...');
    const verifyResponse = await makeRequest(`${serverUrl}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Token verification passed');
    console.log('   User authenticated:', verifyResponse.valid);
    console.log('');

    // 测试创建游戏
    console.log('4. Testing game creation...');
    const gameResponse = await makeRequest(`${serverUrl}/api/game/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Game creation passed');
    console.log('   Game ID:', gameResponse.gameId);
    console.log('   Game State:', gameResponse.gameState.gameState);
    
    const gameId = gameResponse.gameId;
    console.log('');

    // 测试游戏状态更新
    console.log('5. Testing game state update...');
    const updateData = {
      gameState: 'playing',
      playerSnake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
      aiSnake: [{ x: 30, y: 10 }, { x: 31, y: 10 }],
      foods: [{ x: 15, y: 15, color: '#FF0000' }],
      score: 5,
      aiScore: 3,
      lives: 3,
      infiniteMode: true,
      difficulty: 'medium',
      speed: 120,
      currentDirection: { x: 1, y: 0 },
      aiDirection: { x: -1, y: 0 }
    };
    
    const updateResponse = await makeRequest(`${serverUrl}/api/game/${gameId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('✅ Game state update passed');
    console.log('   Updated score:', updateResponse.gameState.score);
    console.log('');

    // 测试获取用户信息
    console.log('6. Testing user profile...');
    const profileResponse = await makeRequest(`${serverUrl}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ User profile passed');
    console.log('   Username:', profileResponse.user.username);
    console.log('   High Score:', profileResponse.user.highScore);
    console.log('');

    // 测试保存游戏记录
    console.log('7. Testing game record save...');
    const recordData = {
      startTime: new Date(Date.now() - 120000).toISOString(),
      endTime: new Date().toISOString(),
      duration: {
        total: 120000,
        seconds: 120,
        formatted: '2:00'
      },
      mode: '无限循环',
      difficulty: 'medium',
      playerScore: 25,
      aiScore: 18,
      winner: '玩家',
      livesUsed: 1,
      isWin: true
    };
    
    const recordResponse = await makeRequest(`${serverUrl}/api/game/${gameId}/record`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });
    
    console.log('✅ Game record save passed');
    console.log('   Record ID:', recordResponse.record.id);
    console.log('');

    // 测试获取用户统计
    console.log('8. Testing user stats...');
    const statsResponse = await makeRequest(`${serverUrl}/api/user/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ User stats passed');
    console.log('   Total Games:', statsResponse.stats.totalGames);
    console.log('   Win Rate:', statsResponse.stats.winRate + '%');
    console.log('');

    // 测试用户登出
    console.log('9. Testing user logout...');
    const logoutResponse = await makeRequest(`${serverUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ User logout passed');
    console.log('');

    console.log('🎉 All tests passed! Backend server is working correctly.');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ User Registration');
    console.log('   ✅ Token Verification');
    console.log('   ✅ Game Creation');
    console.log('   ✅ Game State Update');
    console.log('   ✅ User Profile');
    console.log('   ✅ Game Record Save');
    console.log('   ✅ User Stats');
    console.log('   ✅ User Logout');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure the backend server is running: npm run dev');
    console.error('   2. Check if port 3000 is available');
    console.error('   3. Verify all dependencies are installed: npm install');
    process.exit(1);
  }
}

/**
 * 发送HTTP请求
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData.message || 'Request failed'}`));
          }
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 运行测试
if (require.main === module) {
  testServer();
}

module.exports = { testServer };
