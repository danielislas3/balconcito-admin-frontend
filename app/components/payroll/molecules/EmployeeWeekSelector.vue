<script setup lang="ts">
import type { PayrollEmployee } from '~/types/payroll'
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
import { formatWeekDisplay } from '~/utils/payrollFormatters'
import { CURRENCY_SYMBOLS } from '~/utils/payrollConstants'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const emit = defineEmits<{
  'add-employee': []
  'delete-employee': []
  'create-week': []
}>()

const payrollStore = usePayrollStore()
const {
  employees,
  currentEmployeeId,
  currentWeekId,
  currentEmployee,
  currentEmployeeWeeks
} = storeToRefs(payrollStore)

const breakpoints = useBreakpoints(breakpointsTailwind)
const smAndLarger = breakpoints.greaterOrEqual('sm')

const employeeOptions = computed(() =>
  employees.value.map(emp => ({
    label: emp.name,
    value: emp.id
  }))
)

const weekOptions = computed(() =>
  currentEmployeeWeeks.value.map(week => ({
    label: `Semana del ${formatWeekDisplay(week.startDate)}`,
    value: week.id
  }))
)

const formattedShiftRate = computed(() => {
  if (!currentEmployee.value || !currentEmployee.value.settings) return '--'
  const hourlyRate = currentEmployee.value.settings.baseHourlyRate ?? 0
  const hoursPerShift = currentEmployee.value.settings.hoursPerShift ?? 8
  const shiftRate = hourlyRate * hoursPerShift
  const symbol = CURRENCY_SYMBOLS[currentEmployee.value.settings.currency] || '$'
  return `${symbol}${shiftRate.toFixed(2)}`
})
</script>

<template>
  <UCard
    class="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-emerald-100 dark:border-emerald-900">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-users" class="size-5 text-success-600" />
        <h2 class="text-lg font-semibold">Gestión de Empleados y Semanas</h2>
      </div>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Empleado Activo -->
      <UFormField label="Empleado Activo" required class="sm:col-span-2 lg:col-span-1">
        <div class="flex gap-2">
          <select v-model="currentEmployeeId" @change="payrollStore.onEmployeeChange"
            class="flex-1 min-w-0 px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
            <option value="" disabled>Seleccionar empleado...</option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.name }}
            </option>
          </select>
          <UButton icon="i-lucide-plus" color="success" @click="emit('add-employee')" :size="smAndLarger ? 'md' : 'sm'"
            square />
        </div>
      </UFormField>

      <!-- Semana Activa -->
      <UFormField label="Semana Activa" class="sm:col-span-2 lg:col-span-1">
        <div class="flex gap-2">
          <select v-model="currentWeekId" :disabled="!currentEmployee"
            class="flex-1 min-w-0 px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <option value="" disabled>Seleccionar semana...</option>
            <option v-for="week in currentEmployeeWeeks" :key="week.id" :value="week.id">
              Semana del {{ formatWeekDisplay(week.startDate) }}
            </option>
          </select>
          <UButton icon="i-lucide-calendar-plus" color="success" @click="emit('create-week')"
            :disabled="!currentEmployee" :size="smAndLarger ? 'md' : 'sm'" square />
        </div>
      </UFormField>

      <!-- Tarifa por Turno (Read-only) -->
      <UFormField label="Tarifa por Turno">
        <div
          class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center gap-2 min-h-[42px]">
          <UIcon name="i-lucide-dollar-sign" class="size-4 text-gray-500 flex-shrink-0" />
          <span class="font-semibold text-sm sm:text-base truncate">{{ formattedShiftRate }}</span>
          <span class="text-xs text-gray-500 flex-shrink-0" v-if="currentEmployee?.settings.hoursPerShift">
            ({{ currentEmployee.settings.hoursPerShift }}h)
          </span>
        </div>
      </UFormField>

      <!-- Moneda (Read-only) -->
      <UFormField label="Moneda">
        <div
          class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center gap-2 min-h-[42px]">
          <UIcon name="i-lucide-banknote" class="size-4 text-gray-500 flex-shrink-0" />
          <span class="font-semibold text-sm sm:text-base">{{ currentEmployee?.settings.currency || 'MXN' }}</span>
        </div>
      </UFormField>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <UButton label="Eliminar Empleado" icon="i-lucide-trash-2" color="error" variant="outline"
          @click="emit('delete-employee')" :disabled="!currentEmployee || employees.length <= 1"
          :size="smAndLarger ? 'md' : 'sm'" class="w-full sm:w-auto" />
        <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <UIcon name="i-lucide-info" class="size-3 flex-shrink-0" />
          <span class="leading-tight">Para editar configuración, ve a la pestaña de Configuración</span>
        </div>
      </div>
    </template>
  </UCard>
</template>
