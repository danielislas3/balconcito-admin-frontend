<script setup lang="ts">
/**
 * InlineStat - Compact metric badge following Balconcito Design System
 *
 * Colors map to semantic business contexts:
 * - hours: Sky blue (work hours)
 * - primary: Orange (main actions)
 * - overtime: Amber (1.5x overtime)
 * - money: Violet (payments)
 * - neutral: Stone (general info)
 */
export interface InlineStatProps {
  icon: string
  value: string | number
  label?: string
  color: 'hours' | 'primary' | 'overtime' | 'money' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<InlineStatProps>(), {
  size: 'md'
})

const colorClasses = {
  hours: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    icon: 'text-sky-600 dark:text-sky-400'
  },
  primary: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  overtime: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  money: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400'
  },
  neutral: {
    bg: 'bg-stone-100 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-300',
    icon: 'text-stone-600 dark:text-stone-400'
  }
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'size-3',
    text: 'text-xs'
  },
  md: {
    container: 'px-3 py-2 gap-2',
    icon: 'size-4',
    text: 'text-sm'
  },
  lg: {
    container: 'px-4 py-2 gap-2',
    icon: 'size-5',
    text: 'text-base'
  }
}
</script>

<template>
  <div
    :class="[
      'flex items-center rounded-lg font-bold tabular-nums',
      colorClasses[color].bg,
      colorClasses[color].text,
      sizeClasses[size].container
    ]"
  >
    <UIcon :name="icon" :class="[sizeClasses[size].icon, colorClasses[color].icon]" />
    <span v-if="label" :class="['font-medium', sizeClasses[size].text]">
      {{ label }}:
    </span>
    <span :class="sizeClasses[size].text">{{ value }}</span>
  </div>
</template>
