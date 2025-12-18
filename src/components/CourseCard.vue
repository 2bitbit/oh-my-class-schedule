<script setup lang="ts">
import { computed } from 'vue';
import type { Course } from '../types';

const props = defineProps<{
  course: Course;
  theme?: string;
}>();

const colorStyle = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.course.name.length; i++) {
    hash = props.course.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [210, 150, 270, 45, 340, 250, 180, 190]; // Blue, Green, Purple, Amber, Rose, Indigo, Teal, Cyan
  const hue = hues[Math.abs(hash) % hues.length];

  if (props.theme === 'neon') {
    return {
      '--card-hue': hue,
      '--card-bg': `hsla(${hue}, 80%, 10%, 0.7)`,
      '--card-text': `hsl(${hue}, 100%, 70%)`,
      '--card-border': `hsla(${hue}, 100%, 50%, 0.8)`,
      '--card-shadow': `0 0 5px hsla(${hue}, 100%, 50%, 0.2)`
    };
  } else if (props.theme === 'paper') {
    return {
      '--card-hue': hue,
      '--card-bg': '#ffffff',
      '--card-text': '#333',
      '--card-border': '#ddd',
      '--card-shadow': '0 1px 2px rgba(0,0,0,0.1)'
    };
  } else if (props.theme === 'dark') {
    return {
      '--card-hue': hue,
      '--card-bg': `hsla(${hue}, 30%, 25%, 0.9)`,
      '--card-text': `hsl(${hue}, 60%, 80%)`,
      '--card-border': `hsla(${hue}, 30%, 35%, 0.5)`,
      '--card-shadow': 'none'
    };
  } else if (props.theme === 'forest') {
    return {
      '--card-hue': hue,
      '--card-bg': `hsla(${hue}, 40%, 90%, 0.85)`,
      '--card-text': `hsl(${hue}, 60%, 20%)`,
      '--card-border': `hsla(${hue}, 40%, 60%, 0.3)`,
      '--card-shadow': '0 2px 4px rgba(0, 50, 0, 0.05)'
    };
  } else if (props.theme === 'sunset') {
    return {
      '--card-hue': hue,
      '--card-bg': `hsla(${hue}, 70%, 95%, 0.8)`,
      '--card-text': `hsl(${hue}, 90%, 25%)`,
      '--card-border': `hsla(${hue}, 50%, 80%, 0.4)`,
      '--card-shadow': '0 2px 6px rgba(255, 100, 0, 0.1)'
    };
  } else if (props.theme === 'minimal') {
    return {
      '--card-hue': 0, // Monochrome
      '--card-bg': '#f5f5f5',
      '--card-text': '#000',
      '--card-border': '#000',
      '--card-shadow': 'none'
    };
  }

  // Default / Glass
  return {
    '--card-hue': hue,
    '--card-bg': `hsla(${hue}, 80%, 96%, 0.8)`,
    '--card-text': `hsl(${hue}, 80%, 30%)`,
    '--card-border': `hsla(${hue}, 60%, 80%, 0.5)`,
    '--card-shadow': `0 2px 8px rgba(0, 0, 0, 0.05)`
  };
});
</script>

<template>
  <div class="course-card" :style="colorStyle">
    <div class="course-name">{{ course.name }}</div>
    <div class="course-info">
      <div v-if="course.location" class="info-row">
        <span class="icon">📍</span> {{ course.location }}
      </div>
      <div v-if="course.teacher" class="info-row">
        <span class="icon">👤</span> {{ course.teacher }}
      </div>
      <div class="info-weeks">{{ course.connection.split(']')[0] + ']' }}</div>
    </div>
  </div>
</template>

<style scoped>
.course-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  padding: 2px 3px;
  border-radius: 6px;
  background-color: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}

/* 卡片光泽效果 */
.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.course-card:hover {
  transform: translateY(-2px) scale(1.02);
  z-index: 15;
  box-shadow: var(--card-shadow), 0 8px 16px rgba(0, 0, 0, 0.15);
}

.course-card:hover::before {
  left: 100%;
}

.course-name {
  font-weight: 700;
  font-size: clamp(10px, 1.2vw, 16px);
  flex: none;
  line-height: 1.15;
  margin-bottom: 0;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.course-info {
  font-size: 70%;
  opacity: 0.9;
  width: 120%;
  transform: scale(0.85);
  transform-origin: top left;

}

.info-row {
  display: flex;
  overflow: hidden;
  font-size: clamp(8px, 1.5vw, 10px);
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-weeks {
  font-size: 0.8em;
  opacity: 0.85;
  text-align: right;
  margin-top: auto;
}

.icon {
  font-size: 1em;
  opacity: 0.8;
}
</style>
