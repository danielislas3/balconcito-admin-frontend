<script setup lang="ts">
/**
 * WeeklySummaryCards - Summary cards for weekly payroll metrics
 *
 * Uses Balconcito Design System semantic colors:
 * - hours (sky): Total hours worked
 * - primary (orange): Shifts completed
 * - overtime (amber): Extra hours
 * - money (violet): Total pay
 */
import { formatCurrency } from '~/utils/payrollFormatters'

export interface WeeklySummaryCardsProps {
  totalHours: number
  totalShifts: number
  totalExtraHours: number
  totalPay: number
}

defineProps<WeeklySummaryCardsProps>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Total Horas -->
    <PayrollAtomsStatCard
      icon="i-lucide-clock"
      :value="totalHours.toFixed(1)"
      label="Total Horas"
      color="hours"
    />

    <!-- Turnos Completos -->
    <PayrollAtomsStatCard
      icon="i-lucide-briefcase"
      :value="totalShifts"
      label="Turnos Completos"
      color="primary"
    />

    <!-- Horas Extra -->
    <PayrollAtomsStatCard
      icon="i-lucide-clock-alert"
      :value="totalExtraHours?.toFixed(1) || '0.0'"
      label="Horas Extra"
      color="overtime"
    />

    <!-- Pago Total -->
    <PayrollAtomsStatCard
      icon="i-lucide-banknote"
      :value="formatCurrency(totalPay, 'MXN')"
      label="Pago Total"
      color="money"
    />
  </div>
</template>
