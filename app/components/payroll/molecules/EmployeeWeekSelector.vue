<script setup lang="ts">
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
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
  currentEmployeeWeeks,
  currentWeek
} = storeToRefs(payrollStore)

const breakpoints = useBreakpoints(breakpointsTailwind)
const smAndLarger = breakpoints.greaterOrEqual('sm')

// Computed: Default shift rate from employee settings
const defaultShiftRate = computed(() => {
  if (!currentEmployee.value || !currentEmployee.value.settings) return 0
  const hourlyRate = currentEmployee.value.settings.baseHourlyRate ?? 0
  const hoursPerShift = currentEmployee.value.settings.hoursPerShift ?? 8
  return hourlyRate * hoursPerShift
})

// Local state for editing shift rate
const editingShiftRate = ref(false)
const localShiftRate = ref<number>(0)

// Watch currentWeek to update local shift rate when week changes
watch([currentWeek, currentEmployee], () => {
  if (currentWeek.value && currentEmployee.value) {
    // Use custom shift rate if set, otherwise use employee's default
    localShiftRate.value = currentWeek.value.shiftRate ?? defaultShiftRate.value
  } else {
    localShiftRate.value = defaultShiftRate.value
  }
}, { immediate: true })

const currencySymbol = computed(() => {
  if (!currentEmployee.value?.settings?.currency) return '$'
  return CURRENCY_SYMBOLS[currentEmployee.value.settings.currency] || '$'
})

// Handle shift rate update
const handleShiftRateUpdate = async () => {
  if (!currentWeek.value) return

  editingShiftRate.value = false

  // If the value equals the default, send null to clear custom override
  const valueToSend = localShiftRate.value === defaultShiftRate.value
    ? null
    : localShiftRate.value

  await payrollStore.updateShiftRate(valueToSend)
}

// Handle reset to default
const resetToDefault = () => {
  localShiftRate.value = defaultShiftRate.value
  handleShiftRateUpdate()
}
</script>

<template>
  <UCard class="hover:shadow-lg transition-shadow duration-200">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-users" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">
          Gestión de Empleados y Semanas
        </h2>
      </div>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Empleado Activo -->
      <UFormField label="Empleado Activo" required class="sm:col-span-2 lg:col-span-1">
        <div class="flex gap-2">
          <select
            v-model="currentEmployeeId"
            class="flex-1 min-w-0 px-3 py-2 text-sm sm:text-base border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            @change="payrollStore.onEmployeeChange"
          >
            <option value="" disabled>
              Seleccionar empleado...
            </option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.name }}
            </option>
          </select>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :size="smAndLarger ? 'md' : 'sm'"
            square
            @click="emit('add-employee')"
          />
        </div>
      </UFormField>

      <!-- Semana Activa -->
      <UFormField label="Semana Activa" class="sm:col-span-2 lg:col-span-1">
        <div class="flex gap-2">
          <select
            v-model="currentWeekId"
            :disabled="!currentEmployee"
            class="flex-1 min-w-0 px-3 py-2 text-sm sm:text-base border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              Seleccionar semana...
            </option>
            <option v-for="week in currentEmployeeWeeks" :key="week.id" :value="week.id">
              Semana del {{ formatWeekDisplay(week.startDate) }}
            </option>
          </select>
          <UButton
            icon="i-lucide-calendar-plus"
            color="primary"
            :disabled="!currentEmployee"
            :size="smAndLarger ? 'md' : 'sm'"
            square
            @click="emit('create-week')"
          />
        </div>
      </UFormField>

      <!-- Tarifa por Turno (Editable por semana) -->
      <UFormField label="Tarifa por Turno">
        <div class="flex gap-2">
          <div
            v-if="!editingShiftRate"
            class="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 flex items-center gap-2 min-h-[42px] cursor-pointer hover:border-orange-500 transition-colors"
            @click="editingShiftRate = true"
          >
            <UIcon name="i-lucide-dollar-sign" class="size-4 text-muted flex-shrink-0" />
            <span class="font-semibold text-sm sm:text-base truncate">
              {{ currencySymbol }}{{ localShiftRate.toFixed(2) }}
            </span>
            <span v-if="currentEmployee?.settings.hoursPerShift" class="text-xs text-muted flex-shrink-0">
              ({{ currentEmployee.settings.hoursPerShift }}h)
            </span>
            <UIcon name="i-lucide-pencil" class="size-3 text-muted ml-auto flex-shrink-0" />
          </div>

          <input
            v-else
            v-model.number="localShiftRate"
            type="number"
            step="0.01"
            class="flex-1 px-3 py-2 text-sm sm:text-base border-2 border-orange-500 rounded-md bg-white dark:bg-stone-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm min-h-[42px]"
            :disabled="!currentWeek"
            autofocus
            @blur="handleShiftRateUpdate"
            @keyup.enter="handleShiftRateUpdate"
            @keyup.escape="editingShiftRate = false; localShiftRate = currentWeek?.shiftRate ?? defaultShiftRate"
          >

          <UButton
            v-if="currentWeek?.shiftRate && currentWeek.shiftRate !== defaultShiftRate"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            :size="smAndLarger ? 'md' : 'sm'"
            square
            title="Restaurar a tarifa por defecto"
            @click="resetToDefault"
          />
        </div>
        <template v-if="currentWeek?.shiftRate && currentWeek.shiftRate !== defaultShiftRate" #hint>
          <span class="text-xs text-amber-600 dark:text-amber-400">
            Tarifa personalizada (default: {{ currencySymbol }}{{ defaultShiftRate.toFixed(2) }})
          </span>
        </template>
      </UFormField>

      <!-- Moneda (Read-only) -->
      <UFormField label="Moneda">
        <div
          class="px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-stone-50 dark:bg-stone-900 flex items-center gap-2 min-h-[42px]"
        >
          <UIcon name="i-lucide-banknote" class="size-4 text-muted flex-shrink-0" />
          <span class="font-semibold text-sm sm:text-base">{{ currentEmployee?.settings.currency || 'MXN' }}</span>
        </div>
      </UFormField>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <UButton
          label="Eliminar Empleado"
          icon="i-lucide-trash-2"
          color="error"
          variant="outline"
          :disabled="!currentEmployee || employees.length <= 1"
          :size="smAndLarger ? 'md' : 'sm'"
          class="w-full sm:w-auto"
          @click="emit('delete-employee')"
        />
        <div class="text-xs text-muted flex items-center gap-1">
          <UIcon name="i-lucide-info" class="size-3 flex-shrink-0" />
          <span class="leading-tight">Para editar configuración, ve a la pestaña de Configuración</span>
        </div>
      </div>
    </template>
  </UCard>
</template>
