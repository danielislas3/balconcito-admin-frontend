<script setup lang="ts">
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
import { formatCurrency } from '~/utils/payrollFormatters'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const emit = defineEmits<{
  'add-employee': []
  'delete-employee': []
  'create-week': []
  'save-week': []
}>()

const payrollStore = usePayrollStore()
const {
  currentEmployee,
  currentWeek,
  weekTotals
} = storeToRefs(payrollStore)

// Breakpoints para responsive design
const breakpoints = useBreakpoints(breakpointsTailwind)
const smAndLarger = breakpoints.greaterOrEqual('sm')

// Estado local para propinas con debouncing
const localTips = ref<number>(0)
const tipsTimer = ref<NodeJS.Timeout | null>(null)

// Sincronizar local tips con currentWeek
watch(currentWeek, (newWeek) => {
  if (newWeek) {
    localTips.value = newWeek.weeklyTips || 0
  }
}, { immediate: true })

// Actualizar propinas con debouncing
const updateTips = () => {
  if (tipsTimer.value) {
    clearTimeout(tipsTimer.value)
  }

  tipsTimer.value = setTimeout(async () => {
    await payrollStore.updateWeeklyTips(localTips.value)
  }, 800)
}

// Limpiar timer al desmontar
onBeforeUnmount(() => {
  if (tipsTimer.value) {
    clearTimeout(tipsTimer.value)
  }
})

// Helper to format currency using employee's settings
const formatEmployeeCurrency = (amount: number) => {
  const currency = currentEmployee.value?.settings.currency || 'MXN'
  return formatCurrency(amount, currency as any)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Selector de Empleado y Semana -->
    <PayrollMoleculesEmployeeWeekSelector @add-employee="emit('add-employee')"
      @delete-employee="emit('delete-employee')" @create-week="emit('create-week')" @save-week="emit('save-week')" />

    <!-- Layout Responsive: Stack en móvil, 2 columnas en desktop -->
    <div v-if="currentEmployee && currentWeek" class="flex flex-col lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
      <!-- Tabla de Horarios - Primero en móvil, 60% en desktop -->
      <div class="lg:col-span-3 order-1">
        <PayrollMoleculesScheduleTable :week="currentWeek" :employee-name="currentEmployee.name" />
      </div>

      <!-- Widgets de Resumen - Después en móvil, 40% en desktop -->
      <div class="lg:col-span-2 space-y-3 sm:space-y-4 order-2">
        <!-- Resumen Semanal -->
        <PayrollMoleculesWeeklySummaryCards :total-hours="weekTotals.totalHours" :total-shifts="weekTotals.totalBasePay"
          :total-extra-hours="weekTotals.extraHours" :total-pay="weekTotals.totalPay" />

        <!-- Resumen Compacto para Screenshot -->
        <PayrollMoleculesWeekSummaryCompact :week="currentWeek" :employee-name="currentEmployee.name"
          :currency="currentEmployee.settings?.currency" />

        <!-- Propinas Semanales - Mobile Optimized -->
        <UCard
          class="bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coins" class="size-4 sm:size-5 text-amber-600 flex-shrink-0" />
              <h3 class="text-sm sm:text-base font-semibold">Propinas</h3>
            </div>
          </template>

          <div class="space-y-2 sm:space-y-3">
            <UFormField label="Total de Propinas" class="text-sm">
              <UInput v-model.number="localTips" type="number" step="0.01" min="0" placeholder="0.00"
                icon="i-lucide-dollar-sign" :size="smAndLarger ? 'md' : 'sm'" @input="updateTips" />
            </UFormField>
            <div class="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
              <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pago Base</span>
              <span class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {{ formatEmployeeCurrency(weekTotals.totalBasePay) }}
              </span>
            </div>
            <div
              class="flex justify-between items-center p-2 sm:p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-amber-300 dark:border-amber-700">
              <span class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Total Final</span>
              <span
                class="text-lg sm:text-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tabular-nums">
                {{ formatEmployeeCurrency(weekTotals.totalBasePay + (localTips || 0)) }}
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Estados vacíos -->
    <UCard v-if="!currentEmployee"
      class="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700">
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <div class="p-6 bg-gray-100 dark:bg-gray-700 rounded-full">
            <UIcon name="i-lucide-users" class="size-16 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">No hay empleado seleccionado</h3>
        <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Selecciona un empleado existente o crea uno
          nuevo para comenzar.</p>
        <UButton label="Agregar Primer Empleado" icon="i-lucide-user-plus" color="success" size="lg"
          @click="emit('add-employee')" class="mt-4" />
      </div>
    </UCard>

    <UCard v-else-if="!currentWeek"
      class="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700">
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <div class="p-6 bg-gray-100 dark:bg-gray-700 rounded-full">
            <UIcon name="i-lucide-calendar" class="size-16 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">No hay semana seleccionada</h3>
        <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Selecciona una semana existente o crea una nueva
          para {{ currentEmployee.name }}.</p>
        <UButton label="Crear Nueva Semana" icon="i-lucide-calendar-plus" color="success" size="lg"
          @click="emit('create-week')" class="mt-4" />
      </div>
    </UCard>
  </div>
</template>
