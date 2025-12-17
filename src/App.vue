<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openFileDialog, ask } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import ScheduleGrid from "./components/ScheduleGrid.vue";
import type { Course } from "./types";
import { getWeekNumber } from "./utils";

// 窗口控制函数
const appWindow = getCurrentWindow();
const isMaximized = ref(false);

async function minimizeWindow() {
  try {
    await appWindow.minimize();
  } catch (e) {
    console.error('最小化失败:', e);
  }
}

async function toggleMaximize() {
  try {
    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
      isMaximized.value = false;
    } else {
      await appWindow.maximize();
      isMaximized.value = true;
    }
  } catch (e) {
    console.error('最大化切换失败:', e);
  }
}

async function closeWindow() {
  try {
    await appWindow.close();
  } catch (e) {
    console.error('关闭窗口失败:', e);
  }
}

const courses = ref<Course[]>([]);
const isImporting = ref(false);

const themes = [
  { name: '玻璃拟态', value: 'glass' },
  { name: '霓虹深渊', value: 'neon' },
  { name: '雅致纸白', value: 'paper' },
  { name: '暗夜模式', value: 'dark' },
  { name: '森之静谧', value: 'forest' },
  { name: '落日余晖', value: 'sunset' },
  { name: '极简主义', value: 'minimal' },
];
const currentTheme = ref('glass');

// Week Management
const startSemDate = ref<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
const selectedWeek = ref(1);
const showSettings = ref(false);

// Auto Update
const autoUpdateEnabled = ref(false);
const isCheckingUpdate = ref(false);
const isMobile = ref(false); // Platform check

// Persistence Keys
const TASKS_KEY = 'oh-my-schedule-data';
const THEME_KEY = 'oh-my-schedule-theme';
const DATE_KEY = 'oh-my-schedule-start-date';
const UPDATE_KEY = 'oh-my-schedule-auto-update';

onMounted(() => {
  // 平台检测先执行
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    isMobile.value = true;
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  
  const savedCourses = localStorage.getItem(TASKS_KEY);
  if (savedCourses) {
    try {
      courses.value = JSON.parse(savedCourses);
    } catch (e) {
      console.error("无法解析保存的课表", e);
    }
  }

  const savedDate = localStorage.getItem(DATE_KEY);
  if (savedDate) {
    startSemDate.value = savedDate;
  }
  
  // Calculate current week on load
  const now = new Date();
  const start = new Date(startSemDate.value);
  const w = getWeekNumber(now, start);
  selectedWeek.value = w > 0 ? w : 1;

  // Load auto update setting
  const savedAutoUpdate = localStorage.getItem(UPDATE_KEY);
  if (savedAutoUpdate) {
    autoUpdateEnabled.value = JSON.parse(savedAutoUpdate);
  }

  if (autoUpdateEnabled.value && !isMobile.value) {
    checkForUpdates(true);
  }
});

watch(currentTheme, (newTheme) => {
  localStorage.setItem(THEME_KEY, newTheme);
});

watch(autoUpdateEnabled, (newValue) => {
  localStorage.setItem(UPDATE_KEY, JSON.stringify(newValue));
});

watch(courses, (newCourses) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(newCourses));
}, { deep: true });

watch(startSemDate, (newDate) => {
  localStorage.setItem(DATE_KEY, newDate);
  // Re-calc week if date changes?
  const now = new Date();
  const start = new Date(newDate);
  const w = getWeekNumber(now, start);
  selectedWeek.value = w > 0 ? w : 1;
});

const rootStyle = computed(() => {
  switch (currentTheme.value) {
    case 'neon':
      return {
        '--primary-color': '#0ff',
        '--bg-gradient': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        '--text-main': '#fff',
        '--glass-bg': 'rgba(10, 10, 20, 0.65)',
        '--glass-border': 'rgba(0, 255, 255, 0.2)',
        '--card-backdrop': 'blur(12px)',
        '--accent-gradient': 'linear-gradient(to right, #00f260, #0575e6)',
      };
    case 'paper':
      return {
        '--primary-color': '#444',
        '--bg-gradient': '#f7f5f0',
        '--text-main': '#333',
        '--glass-bg': 'rgba(255, 255, 255, 0.95)',
        '--glass-border': 'rgba(0, 0, 0, 0.05)',
        '--card-backdrop': 'none',
        '--accent-gradient': 'linear-gradient(to right, #444, #777)',
      };
    case 'dark':
      return {
        '--primary-color': '#bb86fc',
        '--bg-gradient': '#121212',
        '--text-main': '#e0e0e0',
        '--glass-bg': 'rgba(35, 35, 35, 0.85)',
        '--glass-border': 'rgba(255, 255, 255, 0.08)',
        '--card-backdrop': 'blur(12px)',
        '--accent-gradient': 'linear-gradient(to right, #bb86fc, #3700b3)',
      };
    case 'forest':
      return {
        '--primary-color': '#2e7d32',
        '--bg-gradient': 'linear-gradient(135deg, #2b580c 0%, #639a67 100%)',
        '--text-main': '#f1f8e9',
        '--glass-bg': 'rgba(20, 50, 20, 0.6)',
        '--glass-border': 'rgba(165, 214, 167, 0.2)',
        '--card-backdrop': 'blur(8px)',
        '--accent-gradient': 'linear-gradient(to right, #66bb6a, #43a047)',
      };
    case 'sunset':
      return {
        '--primary-color': '#ff7043',
        '--bg-gradient': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        '--text-main': '#5d4037',
        '--glass-bg': 'rgba(255, 255, 255, 0.6)',
        '--glass-border': 'rgba(255, 204, 188, 0.6)',
        '--card-backdrop': 'blur(8px)',
        '--accent-gradient': 'linear-gradient(to right, #ff7043, #ffab91)',
      };
    case 'minimal':
       return {
        '--primary-color': '#000',
        '--bg-gradient': '#ffffff',
        '--text-main': '#000',
        '--glass-bg': 'rgba(255,255,255,0.9)',
        '--glass-border': '#eaeaea',
        '--card-backdrop': 'none',
        '--accent-gradient': 'linear-gradient(to right, #000, #444)',
      };
    case 'glass':
    default:
      return {
        '--primary-color': '#4f46e5',
        '--bg-gradient': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        '--text-main': '#1e293b',
        '--glass-bg': 'rgba(255, 255, 255, 0.55)',
        '--glass-border': 'rgba(255, 255, 255, 0.6)',
        '--card-backdrop': 'blur(10px)',
        '--accent-gradient': 'linear-gradient(to right, #6366f1, #d946ef)',
      };
  }
});

async function handleImport() {
  try {
    isImporting.value = true;
    const path = await openFileDialog({
      filters: [{
        name: 'Schedule File',
        extensions: ['txt']
      }]
    });
    
    if (path) {
       const filePath = typeof path === 'string' ? path : (path as any).path; 
       const content = await readTextFile(filePath);
       courses.value = await invoke("import_schedule", { content });
       // Close modal on success
       showSettings.value = false;
    }
  } catch (err) {
    console.error("Failed to import schedule:", err);
    alert("导入失败: " + err);
  } finally {
    isImporting.value = false;
  }
}

async function openWebTool() {
  await openUrl('https://2bitbit.github.io/oh-my-class-schedule/');
}

async function checkForUpdates(silent = false) {
  const RELEASES_URL = 'https://github.com/2bitbit/oh-my-class-schedule/releases/latest';
  
  try {
    isCheckingUpdate.value = true;
    
    // 移动端：直接提供下载链接
    if (isMobile.value) {
      const yes = await ask(
        '安卓版需要手动下载更新。\n\n点击「前往下载」将打开 GitHub 发布页面。', 
        { 
          title: '检查更新',
          kind: 'info',
          okLabel: '前往下载',
          cancelLabel: '取消'
        }
      );
      if (yes) {
        await openUrl(RELEASES_URL);
      }
      return;
    }
    
    // 桌面端：自动检测并下载更新
    const update = await check();
    if (update && update.available) {
      const yes = await ask(
        `发现新版本 v${update.version}\n\n更新内容:\n${update.body}`, 
        { 
          title: 'Oh My Schedule 更新',
          kind: 'info',
          okLabel: '立即更新',
          cancelLabel: '稍后'
        }
      );
      if (yes) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } else if (!silent) {
       await ask('当前已是最新版本', { 
         title: '检查更新', 
         kind: 'info',
         okLabel: '确定'
       });
    }
  } catch (error) {
    console.error(error);
    if (!silent) {
       // Catch specific error for missing release file (common on first install)
       const errStr = String(error);
       if (errStr.includes("Could not fetch a valid release JSON") || errStr.includes("404")) {
         await ask('暂未找到发布信息 (可能是因为这是第一个版本，或者网络无法访问 GitHub)。', { 
           title: '检查更新', 
           kind: 'info',
           okLabel: '确定' 
         });
       } else {
         await ask(`检查更新失败: ${error}`, { title: '错误', kind: 'error' });
       }
    }
  } finally {
    isCheckingUpdate.value = false;
  }
}
</script>

<template>
  <main class="app-container" :style="rootStyle">
    <div class="background-globes" v-if="currentTheme === 'glass'">
      <div class="globe globe-1"></div>
      <div class="globe globe-2"></div>
      <div class="globe globe-3"></div>
    </div>
    <!-- Neon grid background -->
    <div class="background-grid" v-if="currentTheme === 'neon'"></div>

    <!-- 自定义标题栏 (仅桌面端显示) -->
    <div class="custom-titlebar" data-tauri-drag-region v-if="!isMobile">
      <div class="titlebar-drag-area" data-tauri-drag-region></div>
      <div class="titlebar-controls">
        <button class="titlebar-btn" @click="minimizeWindow" title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="2" fill="currentColor"/></svg>
        </button>
        <button class="titlebar-btn" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
          <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12"><path d="M3,0 h7 v7 h-2 v2 h-7 v-7 h2 z M3,2 v5 h5 v-5 z" fill="currentColor"/></svg>
        </button>
        <button class="titlebar-btn close" @click="closeWindow" title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1,1 L11,11 M11,1 L1,11" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </div>

    <header class="app-header">
      <div class="logo-area">
        <h1 class="desktop-title">Oh My Class Schedule</h1>
        <h1 class="mobile-title">OMCS</h1>
      </div>
      
      <!-- Week Controls - 居中 -->
      <div class="week-controls">
        <button class="nav-btn" @click="selectedWeek > 1 ? selectedWeek-- : null">‹</button>
        <span class="week-display" @click="showSettings = true">第 {{ selectedWeek }} 周</span>
        <button class="nav-btn" @click="selectedWeek++">›</button>
      </div>

      <div class="actions">
        <button class="settings-btn-glass" @click="showSettings = !showSettings" title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Settings Modal -->
    <div v-if="showSettings" class="settings-modal-overlay" @click.self="showSettings = false">
      <div class="settings-modal">
        <h3>设置</h3>
        
        <label>主题风格</label>
        <select v-model="currentTheme" class="theme-select">
          <option v-for="theme in themes" :key="theme.value" :value="theme.value">
            {{ theme.name }}
          </option>
        </select>
        
        
        <label>第一周的周一是哪一天？</label>
        <input type="date" v-model="startSemDate" class="date-input" />


        <label>更新设置</label>
        <div class="setting-row">
            <span>自动检查更新</span>
            <input type="checkbox" v-model="autoUpdateEnabled" class="toggle-checkbox" />
        </div>
        <button @click="checkForUpdates(false)" class="secondary-btn" :disabled="isCheckingUpdate">
            {{ isCheckingUpdate ? '检查中...' : '检查更新' }}
        </button>
        <div class="settings-divider"></div>
        
        <label>数据管理</label>
        <div class="button-group">
            <button @click="openWebTool" class="secondary-btn">
                🌍 打开网页转换工具
            </button>
            <button @click="handleImport" class="import-btn" :disabled="isImporting">
                <span v-if="isImporting">导入中...</span>
                <span v-else>📂 导入课表文件</span>
            </button>
        </div>
        
        <button class="close-btn" @click="showSettings = false">关闭</button>
      </div>
    </div>
    
    <div class="content-area">
      <div v-if="courses.length === 0" class="empty-state">
        <h2>暂无课表数据</h2>
        <p>请导入 target.txt 课表文件以开始使用。</p>
        <button @click="handleImport" class="cta-btn">立即导入</button>
      </div>
      <ScheduleGrid 
        v-else 
        :courses="courses" 
        :theme="currentTheme" 
        :current-week="selectedWeek" 
        :start-date="startSemDate"
      />
    </div>
  </main>
</template>

<style>
/* Base Styles will be overridden by inline styles from state */
:root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --primary-color: #6366f1;
  --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  --text-main: #2c3e50;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --accent-gradient: linear-gradient(to right, #6366f1, #ec4899);
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg-gradient);
  color: var(--text-main);
  height: 100vh;
  overflow: hidden;
  transition: background 0.5s ease, color 0.5s ease;
}

.theme-select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-main);
  margin-right: 10px;
  cursor: pointer;
  outline: none;
}

.background-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  background-size: 40px 40px;
  animation: gridMove 20s linear infinite;
  will-change: transform; /* GPU hint */
}

@keyframes gridMove {
  from { transform: perspective(500px) rotateX(20deg) translateY(0); }
  to { transform: perspective(500px) rotateX(20deg) translateY(40px); }
}


/* Update logo gradient to use variable */
.logo-area h1 {
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Week Controls */
.week-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-bg);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05); /* Enhance depth */
}

.nav-btn {
  background: none;
  border: none;
  color: var(--text-main);
  font-size: 1.4rem; /* Larger touch target */
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
  opacity: 0.8;
  transition: all 0.2s;
}
.nav-btn:hover {
  color: var(--primary-color);
  opacity: 1;
  transform: scale(1.1);
}
.week-display {
  font-weight: 700;
  font-size: 1.1em;
  cursor: pointer;
  user-select: none;
  color: var(--text-main);
  /* Text shadow for better contrast on complex backgrounds */
  text-shadow: 0 1px 2px rgba(0,0,0,0.1); 
}
.week-display:hover {
  color: var(--primary-color);
}

/* Icons and Actions */
.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 12px;
}
.icon-btn:hover {
  transform: scale(1.1);
}

/* Settings Modal */
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.settings-modal {
  background: var(--glass-bg);
  background-color: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  width: 320px;
  max-width: calc(100vw - 32px);
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* Custom Scrollbar for Settings Modal */
.settings-modal::-webkit-scrollbar {
  width: 5px; /* Thinner */
}
.settings-modal::-webkit-scrollbar-track {
  background: transparent;
  margin: 10px 0; /* Float effect */
}
.settings-modal::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15); /* Lighter default */
  border-radius: 10px; /* Fully rounded */
}
.settings-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
@media (prefers-color-scheme: dark) {
  .settings-modal::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  }
  .settings-modal::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.settings-modal h3 {
  margin-top: 0;
  color: var(--primary-color);
}

.settings-modal label {
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: -0.5rem;
}

.date-input, .theme-select {
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  width: 100%;
  box-sizing: border-box;
}

.hint {
  font-size: 0.8em;
  color: #666;
  margin-top: -0.5rem;
}

.close-btn {
  margin-top: 1rem;
  padding: 0.6rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  .settings-modal {
    background-color: #2c2c2c;
    color: white;
  }
  .date-input, .theme-select {
    background: #333;
    color: white;
    border-color: #555;
  }
  .hint {
    color: #aaa;
  }
}

.settings-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 1rem 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.secondary-btn {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.secondary-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.settings-modal .import-btn {
  width: 100%;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.toggle-checkbox {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}


@media (prefers-color-scheme: dark) {
  :root {
    --bg-gradient: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    --text-main: #f1f5f9;
    --glass-bg: rgba(30, 41, 59, 0.7);
    --glass-border: rgba(255, 255, 255, 0.1);
  }
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg-gradient);
  color: var(--text-main);
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* Background Animation Globes */
.background-globes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.globe {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
  will-change: transform; /* GPU hint */
}

.globe-1 {
  width: 400px;
  height: 400px;
  background: #a5b4fc;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.globe-2 {
  width: 500px;
  height: 500px;
  background: #fdf2f8; /* pinkish */
  bottom: -150px;
  right: -100px;
  background: #f9a8d4;
  animation-delay: -5s;
}

.globe-3 {
  width: 300px;
  height: 300px;
  background: #67e8f9; /* cyan */
  top: 40%;
  left: 30%;
  opacity: 0.4;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

/* Header */
.app-header {
  padding: 0.8rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo-area {
  flex: 1;
}

.actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.logo-area h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #6366f1, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.import-btn, .cta-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
}

.import-btn:hover, .cta-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.5);
}

.import-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Content */
.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.empty-state h2 {
  font-size: 2rem;
  margin: 0;
  opacity: 0.8;
}

.empty-state p {
  opacity: 0.6;
  margin-bottom: 1rem;
}

/* ========================================
   自定义标题栏样式
======================================== */
.custom-titlebar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 8px;
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-drag-area {
  flex: 1;
  height: 100%;
  -webkit-app-region: drag;
}

.titlebar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  -webkit-app-region: no-drag;
}

.titlebar-btn:hover {
  background: rgba(128, 128, 128, 0.3);
}

.titlebar-btn.close:hover {
  background: #e81123;
  color: white;
}

/* 玉璃风格设置按钮 */
.settings-btn-glass {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-btn-glass:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(30deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.settings-btn-glass svg {
  opacity: 0.8;
}

/* ========================================
   响应式布局 + 移动端标题
======================================== */
.desktop-title {
  display: block;
}
.mobile-title {
  display: none;
}

@media (max-width: 768px) {
  .desktop-title {
    display: none;
  }
  .mobile-title {
    display: block;
  }
  
  .app-header {
    padding: 0.8rem 1rem;
  }
  
  .logo-area h1 {
    font-size: 1.2rem;
  }
  
  .week-controls {
    padding: 4px 12px;
    gap: 8px;
  }
  
  .nav-btn {
    font-size: 1.2rem;
    padding: 0 6px;
    min-width: 32px;
    min-height: 32px;
  }
  
  .icon-btn {
    min-width: 44px;
    min-height: 44px;
    font-size: 1.4rem;
  }
  
  /* .custom-titlebar visibility is controlled by v-if="!isMobile" in template now. 
     Removing CSS display:none allows it to show on small desktop windows. */
}

/* ========================================
   设置弹窗动画增强
======================================== */
.settings-modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.settings-modal {
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Toggle 开关美化 */
.toggle-checkbox {
  appearance: none;
  width: 44px;
  height: 24px;
  background: rgba(120, 120, 128, 0.3);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-checkbox::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-checkbox:checked {
  background: var(--primary-color);
}

.toggle-checkbox:checked::before {
  transform: translateX(20px);
}

/* ========================================
   透明背景支持 (配合原生窗口效果)
======================================== */
html, body, #app {
  background: transparent !important;
}

.app-container {
  background: var(--bg-gradient);
  border-radius: 0;
}

.app-container {
  background: var(--bg-gradient);
  border-radius: 0;
}

/* Removed desktop-specific overrides to match user preference */

/* ========================================
   优化字体栈
======================================== */
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', 'Noto Sans', system-ui, sans-serif;
}

/* ========================================
   全局过渡动画优化
======================================== */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 减少动画 (用户偏好) */
/* 减少动画 (用户偏好) - Removed to enforce custom animations */

</style>