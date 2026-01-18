<script setup lang="ts">
import type { DaySchedule } from '~/types/payroll'

export interface DayScheduleRowProps {
  dayKey: string
  dayName: string
  dayEmoji: string
  schedule: DaySchedule
  currency?: string
  isActive?: boolean
}

const props = withDefaults(defineProps<DayScheduleRowProps>(), {
  isActive: false
})

const formatTime = (hour: string, minute: string) => {
  if (!hour || !minute) return '--:--'
  return `${hour}:${minute}`
}

const hasDayData = computed(() => {
  return props.schedule.hoursWorked > 0
    || (props.schedule.entryHour && props.schedule.exitHour)
})

const formatCurrency = (amount: number) => {
  const symbol = props.currency === 'USD' ? '$' : props.currency === 'EUR' ? '€' : '$'
  return `${symbol}${amount.toFixed(2)}`
}
</script>

<template>
  <div
    :class="[
      'p-5 rounded-xl border-2 transition-all',
      hasDayData
        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-700',
      isActive && 'ring-2 ring-orange-500'
    ]"
  >
    <!-- Encabezado: Día y horario -->
    <div class="flex items-center justify-between mb-3">
      <PayrollAtomsDayLabel
        :emoji="dayEmoji"
        :name="dayName"
        :subtitle="formatTime(schedule.entryHour, schedule.entryMinute) + ' → ' + formatTime(schedule.exitHour, schedule.exitMinute)"
      />

      <div class="text-right">
        <div class="text-xs text-muted">
          Total del día
        </div>
        <div class="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
          {{ formatCurrency(schedule.dailyPay) }}
        </div>
      </div>
    </div>

    <!-- Desglose de horas y pagos -->
    <div v-if="hasDayData" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <!-- Total Hours -->
      <div class="text-center p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
        <div class="text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
          {{ schedule.hoursWorked.toFixed(1) }}h
        </div>
        <div class="text-xs text-muted mt-0.5">
          Total
        </div>
      </div>

      <!-- Regular Hours -->
      <div class="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
        <div class="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
          {{ schedule.regularHours.toFixed(1) }}h
        </div>
        <div class="text-xs text-muted mt-0.5">
          Regular
        </div>
      </div>

      <!-- Overtime Tier 1 -->
      <div v-if="schedule.overtimeHours > 0" class="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
        <div class="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
          {{ schedule.overtimeHours.toFixed(1) }}h
        </div>
        <div class="text-xs text-muted mt-0.5">
          Extra 1.5x
        </div>
      </div>

      <!-- Overtime Tier 2 -->
      <div v-if="schedule.extraHours > 0" class="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
        <div class="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
          {{ schedule.extraHours.toFixed(1) }}h
        </div>
        <div class="text-xs text-muted mt-0.5">
          Extra 2x
        </div>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else class="text-center py-2 text-sm text-muted">
      No trabajado
    </div>
  </div>
</template>
