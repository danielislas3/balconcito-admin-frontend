<script setup lang="ts">
/**
 * WeekSummaryStats - Compact stat badges for weekly hours breakdown
 *
 * Uses Balconcito Design System semantic colors:
 * - hours (sky): Total hours
 * - primary (orange): Regular hours
 * - overtime (amber): Tier 1 overtime
 * - expense (red): Tier 2 overtime
 * - money (violet): Tips/income
 */
export interface WeekSummaryStatsProps {
  totalHours: number
  regularHours: number
  overtimeHours: number // Tier 1 overtime
  extraHours: number // Tier 2 overtime
  totalTips: number
  currency?: string
}

const props = defineProps<WeekSummaryStatsProps>()

const formatCurrency = (amount: number) => {
  const symbol = props.currency === 'USD' ? '$' : props.currency === 'EUR' ? '€' : '$'
  return `${symbol}${amount.toFixed(2)}`
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
    <!-- Total Hours -->
    <div class="text-center p-2 sm:p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg sm:rounded-xl">
      <div class="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
        {{ totalHours.toFixed(1) }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
        Total Horas
      </div>
    </div>

    <!-- Regular Hours -->
    <div class="text-center p-2 sm:p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg sm:rounded-xl">
      <div class="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
        {{ regularHours.toFixed(1) }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
        Hrs Regulares
      </div>
      <div class="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-semibold">
        100%
      </div>
    </div>

    <!-- Overtime Hours Tier 1 -->
    <div class="text-center p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg sm:rounded-xl">
      <div class="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
        {{ overtimeHours.toFixed(1) }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
        Hrs Extra T1
      </div>
      <div class="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-semibold">
        1.5x
      </div>
    </div>

    <!-- Overtime Hours Tier 2 -->
    <div class="text-center p-2 sm:p-3 bg-red-50 dark:bg-red-950/30 rounded-lg sm:rounded-xl">
      <div class="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
        {{ extraHours.toFixed(1) }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
        Hrs Extra T2
      </div>
      <div class="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-semibold">
        2x
      </div>
    </div>

    <!-- Tips -->
    <div class="text-center p-2 sm:p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg sm:rounded-xl col-span-2 sm:col-span-1">
      <div class="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
        {{ formatCurrency(totalTips) }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
        Propinas
      </div>
    </div>
  </div>
</template>
