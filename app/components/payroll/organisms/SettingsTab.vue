<script setup lang="ts">
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
import type { EmployeeSettings } from '~/types/payroll'
import { calculateWeekTotals } from '~/utils/payrollCalculations'
import { formatCurrency } from '~/utils/payrollFormatters'

const emit = defineEmits<{
  'export-system': []
  'import-data': []
  'clear-all': []
}>()

const payrollStore = usePayrollStore()
const { employees, totalWeeks, currentEmployee, currentWeek } = storeToRefs(payrollStore)
const toast = useToast()

// Estado para edición de configuraciones
const editingSettings = ref(false)
const localSettings = ref<Partial<EmployeeSettings>>({})

// Inicializar settings locales cuando cambia el empleado
watch(currentEmployee, (employee) => {
  if (employee) {
    localSettings.value = { ...employee.settings }
  }
}, { immediate: true })

// Calcular estadísticas
const monthlyStats = computed(() => {
  if (!currentEmployee.value) return null

  const dayjs = useDayjs()
  const currentMonth = dayjs().month()
  const currentYear = dayjs().year()

  const weeksThisMonth = currentEmployee.value.weeks.filter(week => {
    const weekDate = dayjs(week.startDate)
    return weekDate.year() === currentYear && weekDate.month() === currentMonth
  })

  const totalPayThisMonth = weeksThisMonth.reduce((sum, week) => {
    const weekTotals = calculateWeekTotals(week)
    return sum + weekTotals.totalPay
  }, 0)

  return {
    weeksThisMonth: weeksThisMonth.length,
    totalPayThisMonth
  }
})

const totalAccumulated = computed(() => {
  return employees.value.reduce((sum, emp) => {
    return sum + emp.weeks.reduce((weekSum, week) => {
      const weekTotals = calculateWeekTotals(week)
      return weekSum + weekTotals.totalPay
    }, 0)
  }, 0)
})

// Guardar configuraciones
const saveSettings = async () => {
  if (!currentEmployee.value) return

  const result = await payrollStore.updateEmployeeSettings(localSettings.value)

  if (result.success) {
    toast.add({
      title: 'Éxito',
      description: 'Configuración actualizada',
      color: 'success'
    })
    editingSettings.value = false
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'No se pudo actualizar',
      color: 'error'
    })
  }
}

const cancelEdit = () => {
  if (currentEmployee.value) {
    localSettings.value = { ...currentEmployee.value.settings }
  }
  editingSettings.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Mensaje si no hay empleado seleccionado -->
    <UCard v-if="!currentEmployee" class="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700">
      <div class="py-12 text-center space-y-4">
        <div class="flex justify-center">
          <div class="p-6 bg-gray-100 dark:bg-gray-700 rounded-full">
            <UIcon name="i-lucide-user-cog" class="size-16 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">No hay empleado seleccionado</h3>
        <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Selecciona un empleado para ver y editar su configuración</p>
      </div>
    </UCard>

    <!-- Configuración del empleado seleccionado -->
    <template v-else>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user-cog" class="size-5 text-emerald-600" />
              <h2 class="text-lg font-semibold">Configuración de {{ currentEmployee.name }}</h2>
            </div>
            <UButton
              v-if="!editingSettings"
              label="Editar"
              icon="i-lucide-edit"
              color="primary"
              variant="soft"
              size="sm"
              @click="editingSettings = true"
            />
          </div>
        </template>

        <div class="space-y-6">
        <!-- Gestión de Datos -->
        <div
          class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-blue-500/10 rounded-lg">
              <UIcon name="i-lucide-database" class="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gestión de Datos</h3>
          </div>
          <div class="flex flex-wrap gap-3">
            <UButton label="Exportar Sistema Completo" icon="i-lucide-download" color="primary" size="lg"
              @click="emit('export-system')" />
            <UButton label="Importar Datos" icon="i-lucide-upload" color="success" size="lg"
              @click="emit('import-data')" />
            <UButton label="Limpiar Todo" icon="i-lucide-trash-2" color="error" variant="outline" size="lg"
              @click="emit('clear-all')" />
          </div>
        </div>

          <!-- Configuración de Tarifas y Horarios -->
          <div class="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-6 rounded-2xl border-2 border-violet-200 dark:border-violet-800">
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-violet-500/10 rounded-lg">
                <UIcon name="i-lucide-dollar-sign" class="size-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tarifas y Horarios</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Tarifa base por hora" :disabled="!editingSettings">
                <UInput
                  v-model.number="localSettings.baseHourlyRate"
                  type="number"
                  step="0.01"
                  :disabled="!editingSettings"
                  icon="i-lucide-dollar-sign"
                />
              </UFormField>
              <UFormField label="Moneda" :disabled="!editingSettings">
                <select
                  v-model="localSettings.currency"
                  :disabled="!editingSettings"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </UFormField>
              <UFormField label="Horas por turno" hint="Horas de trabajo normales por día" :disabled="!editingSettings">
                <UInput
                  v-model.number="localSettings.hoursPerShift"
                  type="number"
                  step="0.5"
                  :disabled="!editingSettings"
                  icon="i-lucide-clock"
                />
              </UFormField>
              <UFormField label="Horas de descanso" hint="Horas de descanso deducidas automáticamente" :disabled="!editingSettings">
                <UInput
                  v-model.number="localSettings.breakHours"
                  type="number"
                  step="0.25"
                  :disabled="!editingSettings"
                  icon="i-lucide-coffee"
                />
              </UFormField>
              <UFormField label="Mínimo para descanso" hint="Horas mínimas trabajadas para aplicar descanso" :disabled="!editingSettings">
                <UInput
                  v-model.number="localSettings.minHoursForBreak"
                  type="number"
                  step="0.5"
                  :disabled="!editingSettings"
                  icon="i-lucide-timer"
                />
              </UFormField>
            </div>
          </div>

          <!-- Configuración de Overtime -->
          <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-amber-500/10 rounded-lg">
                <UIcon name="i-lucide-zap" class="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Configuración de Horas Extra</h3>
            </div>
            <div class="space-y-4">
              <div class="flex items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                <input
                  type="checkbox"
                  v-model="localSettings.usesOvertime"
                  :disabled="!editingSettings"
                  class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 disabled:opacity-50"
                />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Usar horas extra</span>
                  <p class="text-xs text-gray-500">Activar pago de overtime después de las horas regulares</p>
                </div>
              </div>
              <div v-if="localSettings.usesOvertime" class="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-4 border-amber-300 dark:border-amber-700">
                <UFormField label="Tasa Overtime Tier 1" hint="Multiplicador (ej: 1.5 = 150%)" :disabled="!editingSettings">
                  <UInput
                    v-model.number="localSettings.overtimeTier1Rate"
                    type="number"
                    step="0.1"
                    :disabled="!editingSettings"
                    icon="i-lucide-trending-up"
                  />
                </UFormField>
                <UFormField label="Horas Tier 1" hint="Máximo de horas a tasa tier 1" :disabled="!editingSettings">
                  <UInput
                    v-model.number="localSettings.overtimeTier1Hours"
                    type="number"
                    step="0.5"
                    :disabled="!editingSettings"
                    icon="i-lucide-clock"
                  />
                </UFormField>
                <UFormField label="Tasa Overtime Tier 2" hint="Multiplicador (ej: 2.0 = 200%)" :disabled="!editingSettings">
                  <UInput
                    v-model.number="localSettings.overtimeTier2Rate"
                    type="number"
                    step="0.1"
                    :disabled="!editingSettings"
                    icon="i-lucide-trending-up"
                  />
                </UFormField>
                <div class="flex items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-amber-700 dark:text-amber-300">Umbral mínimo</p>
                    <p class="text-lg font-bold text-amber-900 dark:text-amber-100">20 minutos</p>
                    <p class="text-xs text-amber-600 dark:text-amber-400">Solo cuenta overtime si supera 20 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estadísticas del Empleado -->
          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-emerald-500/10 rounded-lg">
                <UIcon name="i-lucide-bar-chart" class="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas</h3>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl text-center">
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Semanas totales</p>
                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ currentEmployee.weeks.length }}</p>
              </div>
              <div v-if="monthlyStats" class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl text-center">
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Semanas este mes</p>
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ monthlyStats.weeksThisMonth }}</p>
              </div>
              <div v-if="monthlyStats" class="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl text-center col-span-2">
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Pago acumulado este mes</p>
                <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ formatCurrency(monthlyStats.totalPayThisMonth, localSettings.currency || 'MXN') }}</p>
              </div>
            </div>
          </div>

          <!-- Botones de acción si está editando -->
          <div v-if="editingSettings" class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="cancelEdit" />
            <UButton label="Guardar Cambios" icon="i-lucide-save" color="success" @click="saveSettings" />
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
