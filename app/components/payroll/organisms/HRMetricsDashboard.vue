<script setup lang="ts">
export interface HRMetrics {
  attendanceRate: number
  totalDaysWorked: number
  totalDaysPossible: number
  perfectWeeks: number
  totalWeeks: number
  totalOvertimeHours: number
  overtimeFrequency: number
  weeksWithOvertime: number
  avgPayPerDay: number
  totalPay: number
}

export interface HRMetricsDashboardProps {
  metrics: HRMetrics
  currency?: string
}

const props = defineProps<HRMetricsDashboardProps>()

const formatCurrency = (amount: number) => {
  const symbol = props.currency === 'USD' ? '$' : props.currency === 'EUR' ? '€' : '$'
  return `${symbol}${amount.toFixed(2)}`
}

const attendanceBadge = computed(() => {
  const rate = props.metrics.attendanceRate
  if (rate >= 80) return { label: 'Excelente', color: 'success' as const }
  if (rate >= 60) return { label: 'Bueno', color: 'warning' as const }
  return { label: 'Bajo', color: 'error' as const }
})

const overtimeBadge = computed(() => {
  const freq = props.metrics.overtimeFrequency
  if (freq > 50) return { label: `${freq.toFixed(0)}%`, color: 'warning' as const }
  return { label: `${freq.toFixed(0)}%`, color: 'primary' as const }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Attendance Rate -->
    <PayrollAtomsStatCard
      icon="i-lucide-calendar-check"
      :value="`${metrics.attendanceRate.toFixed(0)}%`"
      label="Tasa de Asistencia"
      :description="`${metrics.totalDaysWorked} de ${metrics.totalDaysPossible} días posibles`"
      :badge="attendanceBadge"
      color="hours"
    />

    <!-- Perfect Weeks -->
    <PayrollAtomsStatCard
      icon="i-lucide-award"
      :value="metrics.perfectWeeks"
      label="Semanas Perfectas"
      description="7+ turnos completos por semana"
      :badge="{ label: 'Top Performer', color: 'success' }"
      color="income"
    />

    <!-- Overtime Analysis -->
    <PayrollAtomsStatCard
      icon="i-lucide-clock-alert"
      :value="metrics.totalOvertimeHours.toFixed(1)"
      label="Horas Extra Totales"
      :description="`En ${metrics.weeksWithOvertime} de ${metrics.totalWeeks} semanas`"
      :badge="overtimeBadge"
      color="overtime"
    />

    <!-- Average Pay Per Day -->
    <PayrollAtomsStatCard
      icon="i-lucide-trending-up"
      :value="formatCurrency(metrics.avgPayPerDay)"
      label="Pago Promedio/Día"
      :description="`Total: ${formatCurrency(metrics.totalPay)}`"
      :badge="{ label: 'Promedio', color: 'primary' }"
      color="money"
    />
  </div>
</template>
