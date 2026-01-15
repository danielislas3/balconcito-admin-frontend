<script setup lang="ts">
/**
 * StatCard - Large metric card following Balconcito Design System
 *
 * Semantic colors for payroll contexts:
 * - hours: Sky blue (total hours)
 * - primary: Orange (shifts, main metrics)
 * - overtime: Amber (overtime hours)
 * - money: Violet (total pay)
 * - income: Lime (earnings)
 * - expense: Red (deductions)
 */

type StatColor = 'hours' | 'primary' | 'overtime' | 'money' | 'income' | 'expense'

export interface StatCardProps {
  icon: string
  value: string | number
  label: string
  description?: string
  badge?: {
    label: string
    color: 'success' | 'warning' | 'error' | 'primary' | 'neutral'
  }
  color: StatColor
}

defineProps<StatCardProps>()

const colorConfig: Record<StatColor, { bg: string, border: string, iconBg: string, icon: string, text: string }> = {
  hours: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
    icon: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-600 dark:text-sky-400'
  },
  primary: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
    icon: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400'
  },
  overtime: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400'
  },
  money: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    icon: 'text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400'
  },
  income: {
    bg: 'bg-lime-50 dark:bg-lime-950/30',
    border: 'border-lime-200 dark:border-lime-800',
    iconBg: 'bg-lime-100 dark:bg-lime-900/50',
    icon: 'text-lime-600 dark:text-lime-400',
    text: 'text-lime-600 dark:text-lime-400'
  },
  expense: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400'
  }
}
</script>

<template>
  <div
    :class="[
      'relative p-5 rounded-xl border-2 hover:shadow-lg transition-shadow duration-200',
      colorConfig[color].bg,
      colorConfig[color].border
    ]"
  >
    <!-- Icon and Badge -->
    <div class="flex items-center justify-between mb-4">
      <div :class="['p-2.5 rounded-lg', colorConfig[color].iconBg]">
        <UIcon :name="icon" :class="['size-5', colorConfig[color].icon]" />
      </div>
      <UBadge v-if="badge" :color="badge.color" variant="subtle">
        {{ badge.label }}
      </UBadge>
    </div>

    <!-- Value -->
    <div :class="['text-3xl font-bold mb-1 tabular-nums', colorConfig[color].text]">
      {{ value }}
    </div>

    <!-- Label -->
    <div class="text-sm font-medium text-muted uppercase tracking-wider">
      {{ label }}
    </div>

    <!-- Description -->
    <div v-if="description" class="text-xs text-muted mt-2">
      {{ description }}
    </div>
  </div>
</template>
