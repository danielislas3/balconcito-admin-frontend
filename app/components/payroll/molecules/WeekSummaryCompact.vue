<script setup lang="ts">
import type { PayrollWeek } from '~/types/payroll'
import { calculateWeekTotals } from '~/utils/payrollCalculations'
import { formatCurrency as formatCurrencyUtil, formatWeekDisplay } from '~/utils/payrollFormatters'
import { WEEK_DAYS } from '~/utils/payrollConstants'

export interface WeekSummaryCompactProps {
  week: PayrollWeek
  employeeName: string
  currency?: string
}

const props = defineProps<WeekSummaryCompactProps>()

const formatCurrency = (amount: number) => {
  return formatCurrencyUtil(amount, (props.currency || 'MXN') as any)
}

// Calcular totales de la semana (reactivo)
// Agregar validación para evitar errores cuando week no está definido
const weekTotals = computed(() => {
  if (!props.week) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      extraHours: 0,
      totalBasePay: 0,
      totalPay: 0,
      totalShifts: 0,
      totalOvertimeHours: 0
    }
  }
  return calculateWeekTotals(props.week)
})
</script>

<template>
  <UCard class="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border-2 border-gray-300 dark:border-gray-700">
    <template #header>
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-receipt" class="size-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <h3 class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Resumen Semanal</h3>
        </div>
        <div class="text-xs text-gray-500 truncate max-w-full sm:max-w-[150px]">{{ employeeName }}</div>
      </div>
    </template>

    <!-- Tabla compacta de días - Mobile Optimized -->
    <div v-if="week && week.schedule" class="space-y-1">
      <div
        v-for="day in WEEK_DAYS"
        :key="day.key"
        v-show="week.schedule[day.key]?.hoursWorked > 0"
        class="flex items-center justify-between p-1.5 sm:p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">

        <div class="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <span class="text-xs sm:text-sm flex-shrink-0">{{ day.emoji }}</span>
          <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-14 sm:w-20 truncate">{{ day.name }}</span>
          <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {{ week.schedule[day.key]?.hoursWorked.toFixed(1) }}h
          </span>
        </div>

        <div class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tabular-nums flex-shrink-0">
          {{ formatCurrency(week.schedule[day.key]?.dailyPay || 0) }}
        </div>
      </div>
    </div>

    <!-- Total de la semana - Mobile Optimized -->
    <div v-if="week" class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-gray-300 dark:border-gray-600">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg">
        <div class="flex-1 min-w-0">
          <div class="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">Semana del {{ formatWeekDisplay(week.startDate) }}</div>
          <div class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ weekTotals.totalHours.toFixed(1) }}h totales
            <span v-if="week.weeklyTips > 0" class="block sm:inline text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
              + {{ formatCurrency(week.weeklyTips) }} propinas
            </span>
          </div>
        </div>
        <div class="text-right self-end sm:self-auto">
          <div class="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {{ formatCurrency(weekTotals.totalPay) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
