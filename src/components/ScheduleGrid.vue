<script setup lang="ts">
import { computed } from 'vue';

import type { Course } from '../types';
import CourseCard from './CourseCard.vue';
import { isCourseActiveInWeek, getWeekNumber } from '../utils';

const props = defineProps<{
  courses: Course[];
  theme?: string;
  currentWeek?: number;
  startDate?: string;
}>();

// Simple headers as requested: "一"..."日"
const days = ['一', '二', '三', '四', '五', '六', '日'];
const dayMap: Record<string, number> = {
  '星期一': 0, '星期二': 1, '星期三': 2, '星期四': 3, '星期五': 4, '星期六': 5, '星期日': 6,
  'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
};
// Map simplified header back to index for date calc
const headerIndexMap: Record<string, number> = {
  '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6
};

// 12 slots for the day
// Calculate visible time slots (auto-hide 11-12 if empty)
const timeSlots = computed(() => {
  const maxSlot = parsedCourses.value.reduce((max, c) => {
    // gridRowEnd is (endSlot + 2), so endSlot is (gridRowEnd - 2)
    const endSlot = c.gridRowEnd - 2;
    return Math.max(max, endSlot);
  }, 10); // Minimum 10 slots

  // If max used slot is <= 10, show 10 slots. Otherwise show 12.
  const count = maxSlot > 10 ? 12 : 10;
  return Array.from({ length: count }, (_, i) => i + 1);
});

interface GridCourse extends Course {
  gridColumn: number;
  gridRowStart: number;
  gridRowEnd: number;
  dayIndex: number;
}

const parsedCourses = computed<GridCourse[]>(() => {
  return props.courses.filter(c => {
    // If currentWeek is provided, check if course is active
    if (props.currentWeek) {
      return isCourseActiveInWeek(c.connection, props.currentWeek);
    }
    return true;
  }).map(c => {
    const dayStr = c.connection.split(' ').find(s => s.startsWith('星期') || dayMap[s] !== undefined);
    const dayIndex = dayStr ? dayMap[dayStr] : -1;

    const nums = c.time.match(/\d+/g);
    let start = 1;
    let end = 1;
    if (nums && nums.length >= 2) {
      start = parseInt(nums[0]);
      end = parseInt(nums[1]);
    }

    return {
      ...c,
      dayIndex,
      gridColumn: dayIndex + 2, // +1 because time column is first, +1 because grid is 1-based
      gridRowStart: start + 1, // +1 because header row
      gridRowEnd: end + 2 // +1 for header, +1 for exclusive end
    };
  }).filter(c => c.gridColumn > 1);
});

// Calculate if we need to show Saturday and Sunday
const showWeekend = computed(() => {
  // Check if any visible course is on Sat(5) or Sun(6)
  return parsedCourses.value.some(c => c.dayIndex === 5 || c.dayIndex === 6);
});

const visibleDays = computed(() => {
  if (showWeekend.value) {
    return days;
  } else {
    return days.slice(0, 5); // Only Mon-Fri
  }
});

// Calculate Today's Index (0-6, Mon-Sun)
const todayIndex = computed(() => {
  const day = new Date().getDay(); // 0 is Sunday
  return (day + 6) % 7; // Convert to 0=Mon, 6=Sun
});

// Calculate the REAL current week number based on start date
const realCurrentWeek = computed(() => {
  if (!props.startDate) return -1;
  return getWeekNumber(new Date(), new Date(props.startDate));
});

const gridStyle = computed(() => {
  // Uses 8 columns always (Time + 7 Days).
  // If weekend hidden, last 2 columns animate to 0fr.
  // We use 0.0001fr to allow transition interpolation (0fr sometimes doesn't animate in some browsers).
  const weekendWidth = showWeekend.value ? '1fr' : '0.0001fr';

  return {
    gridTemplateColumns: `28px repeat(5, minmax(0, 1fr)) repeat(2, minmax(0, ${weekendWidth}))`
  };
});

function getDateString(dayName: string): string {
  if (!props.startDate || !props.currentWeek) return '';

  const start = new Date(props.startDate);
  const dayIndex = headerIndexMap[dayName];
  // Calculate offset: (Week - 1) * 7 + DayIndex
  const offset = (props.currentWeek - 1) * 7 + dayIndex;

  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + offset);

  // Format: MM.DD
  const m = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const d = targetDate.getDate().toString().padStart(2, '0');
  return `${m}.${d}`;
}

function isToday(dayName: string): boolean {
  // 1. Check if the viewed week is the actual current week
  if (props.currentWeek && realCurrentWeek.value !== -1 && props.currentWeek !== realCurrentWeek.value) {
    return false;
  }

  // 2. Check if the day matches today
  const dayIndex = headerIndexMap[dayName];
  return dayIndex === todayIndex.value;
}

</script>

<template>
  <div class="schedule-container">
    <div class="schedule-grid" :style="gridStyle">
      <!-- Header Row -->
      <div class="header-cell time-header" style="visibility: hidden;"></div>
      <div v-for="(day) in visibleDays" :key="day" class="header-cell day-header"
        :class="{ 'is-today-header': isToday(day) }">
        <span class="day-name">{{ day }}</span>
        <span class="day-date">{{ getDateString(day) }}</span>
      </div>

      <!-- Time Slots (Rows) -->
      <div v-for="slot in timeSlots" :key="`slot-${slot}`" class="time-cell" :style="{ gridRow: slot + 1 }">
        {{ slot }}
      </div>

      <!-- Grid Lines/Background for reference -->
      <!-- We use full length for index to match column positions -->
      <!-- WARN: For columns, we don't have 'day' string easily mapped if we just loop number.
           Better to loop visibleDays again to act as columns. -->
      <div v-for="(day, i) in visibleDays" :key="`bg-day-${day}`" class="grid-column-bg"
        :class="{ 'is-today-column': isToday(day) }" :style="{ gridColumn: i + 2, gridRow: '2 / -1' }"></div>

      <!-- Visual Separators -->
      <!-- Morning/Afternoon Divider (After 4th slot) -->
      <div class="time-divider" style="grid-row: 6; grid-column: 1 / -1; margin-top: -2px;">
        <div class="divider-line"></div>
      </div>
      <!-- Afternoon/Evening Divider (After 8th slot) -->
      <div class="time-divider" style="grid-row: 10; grid-column: 1 / -1; margin-top: -2px;">
        <div class="divider-line"></div>
      </div>

      <!-- Courses -->
      <TransitionGroup name="course" tag="div" style="display: contents">
        <div v-for="(course) in parsedCourses" :key="`${course.name}-${course.dayIndex}-${course.time}`"
          class="course-wrapper" :style="{
            gridColumn: course.gridColumn,
            gridRowStart: course.gridRowStart,
            gridRowEnd: course.gridRowEnd,
            // When weekend hidden, grid cols 7 & 8 shrink to 0.
            // We should hide content in them to avoid overflow/mess, BUT
            // during 'leave' animation we might want them to fade.
            // Since the column width shrinks, opacity fade is good. 
            // We only force hide if it's NOT leaving? 
            // Actually, simply letting them clip or overflow:hidden in the cell is best.
            // course-wrapper has overflow:hidden.
            // So just let standard Vue transition handle removal.
            // display: 'block' is fine.
          }">
          <CourseCard :course="course" :theme="props.theme" />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* Base Styles with cleaner, adaptive layout */
.schedule-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* contain grid */
  padding: 4px;
  /* Minimal padding */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.schedule-grid {
  display: grid;
  /* grid-template-columns is set dynamically via inline style */
  /* Header row + data rows. Use 1fr to strictly fit container height */
  grid-template-rows: 30px repeat(v-bind('timeSlots.length'), minmax(0, 1fr));
  gap: 2px;
  flex-grow: 1;
  height: 100%;
  /* Force fill */
  min-width: 0;
  position: relative;
  transition: all 0.3s ease;
  /* Smooth resize */
}

/* Mobile Optimizations - remove fallback min-width */
@media (max-width: 768px) {
  .schedule-grid {
    min-width: 0;
  }
}

.header-cell {
  background: var(--glass-bg);
  /* Use theme variable */
  backdrop-filter: var(--card-backdrop);
  /* Use theme variable */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-main);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  /* position: sticky not needed if container doesn't scroll */
  z-index: 20;
  font-size: 0.8em;
}

.day-header {
  font-size: 0.8em;
  flex-direction: column;
  /* Stack name and date */
  gap: 1px;
  line-height: 1;
  padding: 2px 0;
}

.day-name {
  font-weight: 700;
}

.day-date {
  font-size: 0.75em;
  opacity: 0.6;
  font-weight: 400;
  font-family: 'Consolas', monospace;
  /* Monospace for alignment */
}

.time-cell {
  grid-column: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  opacity: 0.6;
  font-size: 0.65em;
  color: var(--text-main);
}

/* Paper Theme Low Contrast Fix */
:global(.app-container[style*="--glass-bg: rgba(255, 255, 255, 0.95)"] .time-cell),
/* Or cleaner: check prop via class? But style is scoped. Better to rely on --text-main. 
   Paper theme sets --text-main to #333. Opacity 0.6 makes it ~#888 on white. 
   We want it darker. */
.time-cell {
  /* Dynamic opacity boost for light themes if needed, or just remove opacity */
  opacity: 0.8;
}

.grid-column-bg {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  pointer-events: none;
  transition: all 0.3s ease;
}

.is-today-column {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
  /* Subtle glow */
}

.is-today-header {
  background: var(--primary-color) !important;
  color: #fff !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.is-today-header .day-date {
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
}

.time-divider {
  z-index: 5;
  pointer-events: none;
  height: 0;
  position: relative;
  display: flex;
  align-items: center;
}

.divider-line {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--card-border) 10%, var(--card-border) 90%, transparent 100%);
  opacity: 0.8;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}


/* Course Animations */
.course-move,
.course-enter-active,
.course-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.course-enter-from,
.course-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(10px);
  filter: blur(4px);
  /* Glassy fade effect */
}

/* Ensure leaving items are taken out of flow (optional if grid position is static)
   But for grid, leaving items usually stay in their cell until gone.
   Overlapping is handled by z-index usually. */
/* Ensure leaving items are taken out of flow (optional if grid position is static)
   But for grid, leaving items usually stay in their cell until gone.
   Overlapping is handled by z-index usually. */
.course-leave-active {
  /* Using position: absolute creates sizing issues in Grid. 
     Just letting them overlap in the same grid cell works fine for cross-fade. */
  z-index: 1;
  /* Lower than entering items */
  /* Remove width/height 100% as that referred to container, causing explosion */
  pointer-events: none;
  /* Don't block clicks while fading */
}

.course-enter-active {
  z-index: 5;
  /* Ensure new item is on top */
}

.course-wrapper {
  /* transition handled by transition-group classes above */
  z-index: 10;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* Ensure card stays in cell */
}

/* Scrollbar styling */
.schedule-container::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.schedule-container::-webkit-scrollbar-track {
  background: transparent;
}

.schedule-container::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 100, 0.2);
  border-radius: 4px;
}

.schedule-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.3);
}

@media (prefers-color-scheme: dark) {
  .grid-column-bg {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>
