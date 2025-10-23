'use strict';

// 音频系统管理类
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.musicEnabled = true;
    this.soundEnabled = true;
    this.musicGain = null;
    this.soundGain = null;
    this.backgroundMusic = null;
  }

  // 初始化音频系统
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建音频节点
      this.musicGain = this.audioContext.createGain();
      this.soundGain = this.audioContext.createGain();
      
      this.musicGain.connect(this.audioContext.destination);
      this.soundGain.connect(this.audioContext.destination);
      
      // 设置音量
      this.musicGain.gain.value = 0.3; // 背景音乐音量
      this.soundGain.gain.value = 0.5; // 音效音量
    } catch (e) {
      console.log('音频初始化失败:', e);
    }
  }

  // 播放音效
  playSound(frequency, duration, type = 'sine') {
    if (!this.soundEnabled || !this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.soundGain);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.log('音效播放失败:', e);
    }
  }

  // 播放旋律音符
  playMelodyNote(frequency, duration, waveType = 'sine', volume = 0.2) {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.musicGain);
      
      oscillator.frequency.value = frequency;
      oscillator.type = waveType;
      
      // 更柔和的音量包络
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.log('音符播放失败:', e);
    }
  }

  // 播放背景音乐 - "You and me we are family"
  startBackgroundMusic() {
    if (!this.musicEnabled || !this.audioContext) return;
    
    try {
      // "You and me we are family" 完整旋律
      const playFamilySong = () => {
        if (!this.musicEnabled) return;
        
        // 主旋律 - "You and me we are family"
        const mainMelody = [
          // "You and me"
          { freq: 523.25, duration: 0.3, delay: 0 },      // C5
          { freq: 659.25, duration: 0.3, delay: 300 },      // E5
          { freq: 783.99, duration: 0.5, delay: 600 },     // G5
          
          // "we are"
          { freq: 698.46, duration: 0.25, delay: 1100 },     // F5
          { freq: 659.25, duration: 0.25, delay: 1350 },     // E5
          
          // "family"
          { freq: 523.25, duration: 0.3, delay: 1600 },   // C5
          { freq: 587.33, duration: 0.3, delay: 1900 },     // D5
          { freq: 659.25, duration: 0.5, delay: 2200 },     // E5
          { freq: 523.25, duration: 0.7, delay: 2700 },     // C5 (长音)
          
          // 间奏
          { freq: 0, duration: 0, delay: 3400 },           // 静音
          
          // 重复主旋律
          { freq: 523.25, duration: 0.3, delay: 4000 },     // C5
          { freq: 659.25, duration: 0.3, delay: 4300 },      // E5
          { freq: 783.99, duration: 0.5, delay: 4600 },     // G5
          
          { freq: 698.46, duration: 0.25, delay: 5100 },     // F5
          { freq: 659.25, duration: 0.25, delay: 5350 },     // E5
          
          { freq: 523.25, duration: 0.3, delay: 5600 },     // C5
          { freq: 587.33, duration: 0.3, delay: 5900 },     // D5
          { freq: 659.25, duration: 0.5, delay: 6200 },     // E5
          { freq: 523.25, duration: 1.0, delay: 6700 },      // C5 (更长音)
        ];
        
        // 和声部分
        const harmony = [
          // 低音和声
          { freq: 261.63, duration: 0.8, delay: 0 },       // C4
          { freq: 329.63, duration: 0.8, delay: 800 },      // E4
          { freq: 392.00, duration: 0.8, delay: 1600 },     // G4
          { freq: 349.23, duration: 0.8, delay: 2400 },     // F4
          { freq: 261.63, duration: 1.2, delay: 3200 },     // C4 (长音)
          
          // 重复和声
          { freq: 261.63, duration: 0.8, delay: 4400 },    // C4
          { freq: 329.63, duration: 0.8, delay: 5200 },     // E4
          { freq: 392.00, duration: 0.8, delay: 6000 },     // G4
          { freq: 349.23, duration: 0.8, delay: 6800 },     // F4
          { freq: 261.63, duration: 1.5, delay: 7600 },     // C4 (更长音)
        ];
        
        // 播放主旋律
        mainMelody.forEach((note) => {
          setTimeout(() => {
            if (this.musicEnabled && note.freq > 0) {
              this.playMelodyNote(note.freq, note.duration, 'sine');
            }
          }, note.delay);
        });
        
        // 播放和声
        harmony.forEach((note) => {
          setTimeout(() => {
            if (this.musicEnabled && note.freq > 0) {
              this.playMelodyNote(note.freq, note.duration, 'triangle', 0.15);
            }
          }, note.delay);
        });
        
        // 循环播放整首歌
        setTimeout(playFamilySong, 9200); // 约9.2秒后重复
      };
      
      playFamilySong();
    } catch (e) {
      console.log('背景音乐播放失败:', e);
    }
  }

  // 停止背景音乐
  stopBackgroundMusic() {
    // 简单的背景音乐停止（实际实现中可能需要更复杂的控制）
  }

  // 切换音乐开关
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  // 切换音效开关
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // 获取音乐状态
  isMusicEnabled() {
    return this.musicEnabled;
  }

  // 获取音效状态
  isSoundEnabled() {
    return this.soundEnabled;
  }
}
