<script setup lang="ts">
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
import { formatCurrency } from '~/utils/payrollFormatters'
import type { Currency } from '~/utils/payrollConstants'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const emit = defineEmits<{
  'add-employee': []
  'delete-employee': []
  'create-week': []
  'save-week': []
}>()

const payrollStore = usePayrollStore()
const {
  employeeList,
  currentEmployee,
  currentWeek,
  weekTotals,
  loading,
  loadingEmployee
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
  return formatCurrency(amount, currency as Currency)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Selector de Empleado y Semana -->
    <PayrollMoleculesEmployeeWeekSelector
      @add-employee="emit('add-employee')"
      @delete-employee="emit('delete-employee')"
      @create-week="emit('create-week')"
      @save-week="emit('save-week')"
    />

    <!-- Layout Responsive: Stack en móvil, 2 columnas en desktop -->
    <div v-if="currentEmployee && currentWeek" class="flex flex-col lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
      <!-- Tabla de Horarios - Primero en móvil, 60% en desktop -->
      <div class="lg:col-span-3 order-1">
        <PayrollMoleculesScheduleTable :week="currentWeek" :employee-name="currentEmployee.name" />
      </div>

      <!-- Widgets de Resumen - Después en móvil, 40% en desktop -->
      <div class="lg:col-span-2 space-y-3 sm:space-y-4 order-2">
        <!-- Resumen Semanal -->
        <PayrollMoleculesWeeklySummaryCards
          :total-hours="weekTotals.totalHours"
          :total-shifts="weekTotals.totalShifts"
          :total-extra-hours="weekTotals.totalOvertimeHours"
          :total-pay="weekTotals.totalPay"
        />

        <!-- Resumen Compacto para Screenshot -->
        <PayrollMoleculesWeekSummaryCompact
          :week="currentWeek"
          :employee-name="currentEmployee.name"
          :currency="currentEmployee.settings?.currency"
        />

        <!-- Propinas Semanales - Mobile Optimized -->
        <UCard
          class="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 shadow-lg"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-coins" class="size-4 sm:size-5 text-amber-600 flex-shrink-0" />
              <h3 class="text-sm sm:text-base font-semibold">
                Propinas
              </h3>
            </div>
          </template>

          <div class="space-y-2 sm:space-y-3">
            <UFormField label="Total de Propinas" class="text-sm">
              <UInput
                v-model.number="localTips"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                icon="i-lucide-dollar-sign"
                :size="smAndLarger ? 'md' : 'sm'"
                @input="updateTips"
              />
            </UFormField>
            <div class="flex justify-between items-center p-2 bg-white/50 dark:bg-stone-800/50 rounded">
              <span class="text-xs sm:text-sm text-muted">Pago Base</span>
              <span class="text-base sm:text-lg font-bold tabular-nums">
                {{ formatEmployeeCurrency(weekTotals.totalBasePay) }}
              </span>
            </div>
            <div
              class="flex justify-between items-center p-2 sm:p-3 bg-white/80 dark:bg-stone-800/80 rounded-lg border-2 border-amber-300 dark:border-amber-700"
            >
              <span class="text-xs sm:text-sm font-semibold">Total Final</span>
              <span
                class="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums"
              >
                {{ formatEmployeeCurrency(weekTotals.totalBasePay + (localTips || 0)) }}
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Estado: Cargando empleado -->
    <UCard v-if="loadingEmployee" class="border-2 border-default">
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <UIcon name="i-lucide-loader-2" class="size-12 text-primary animate-spin" />
        </div>
        <p class="text-muted">
          Cargando datos del empleado...
        </p>
      </div>
    </UCard>

    <!-- Estado: Sin empleados registrados -->
    <UCard
      v-else-if="!loading && employeeList.length === 0"
      class="border-2 border-dashed border-default"
    >
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <div class="p-6 bg-stone-100 dark:bg-stone-800 rounded-full">
            <UIcon name="i-lucide-users" class="size-16 text-muted" />
          </div>
        </div>
        <h3 class="text-xl font-bold">
          Sin empleados registrados
        </h3>
        <p class="text-muted max-w-md mx-auto">
          Agrega tu primer empleado para comenzar a gestionar la nómina.
        </p>
        <UButton
          label="Agregar Primer Empleado"
          icon="i-lucide-user-plus"
          color="primary"
          size="lg"
          class="mt-4"
          @click="emit('add-employee')"
        />
      </div>
    </UCard>

    <!-- Estado: Empleado seleccionado pero sin semana -->
    <UCard
      v-else-if="currentEmployee && !currentWeek"
      class="border-2 border-dashed border-default"
    >
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <div class="p-6 bg-stone-100 dark:bg-stone-800 rounded-full">
            <UIcon name="i-lucide-calendar" class="size-16 text-muted" />
          </div>
        </div>
        <h3 class="text-xl font-bold">
          No hay semana seleccionada
        </h3>
        <p class="text-muted max-w-md mx-auto">
          Selecciona una semana existente o crea una nueva
          para {{ currentEmployee.name }}.
        </p>
        <UButton
          label="Crear Nueva Semana"
          icon="i-lucide-calendar-plus"
          color="primary"
          size="lg"
          class="mt-4"
          @click="emit('create-week')"
        />
      </div>
    </UCard>
  </div>
</template>
