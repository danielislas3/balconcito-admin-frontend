<script setup lang="ts">
import { Time } from '@internationalized/date'
import type { PayrollWeek, WeekSchedule, DaySchedule } from '~/types/payroll'
import { usePayrollStore } from '~/stores/payroll'
import { formatWeekDisplay, formatCurrency } from '~/utils/payrollFormatters'
import { WEEK_DAYS } from '~/utils/payrollConstants'

export interface ScheduleTableProps {
  week: PayrollWeek
  employeeName: string
}

const props = defineProps<ScheduleTableProps>()
const payrollStore = usePayrollStore()
const toast = useToast()

const localSchedules = ref<Record<string, Partial<DaySchedule>>>({})
const saveTimers = ref<Record<string, NodeJS.Timeout>>({})
const savingDays = ref<Set<string>>(new Set())
const bulkSaving = ref(false)

watch(() => props.week, (newWeek) => {
  if (newWeek) {
    localSchedules.value = {}
    Object.keys(saveTimers.value).forEach(key => clearTimeout(saveTimers.value[key]))
    saveTimers.value = {}
    savingDays.value = new Set()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  Object.keys(saveTimers.value).forEach(key => clearTimeout(saveTimers.value[key]))
})

const debouncedSave = async (dayKey: string, updates: Partial<DaySchedule>, delay = 800) => {
  if (saveTimers.value[dayKey]) {
    clearTimeout(saveTimers.value[dayKey])
  }

  localSchedules.value[dayKey] = {
    ...localSchedules.value[dayKey],
    ...updates
  }

  saveTimers.value[dayKey] = setTimeout(async () => {
    savingDays.value.add(dayKey)

    const currentSchedule = props.week.schedule[dayKey as keyof WeekSchedule]
    const finalUpdates = {
      ...currentSchedule,
      ...localSchedules.value[dayKey],
      ...updates
    }

    await payrollStore.updateDaySchedule(dayKey as keyof WeekSchedule, {
      entryHour: finalUpdates.entryHour || '',
      entryMinute: finalUpdates.entryMinute || '',
      exitHour: finalUpdates.exitHour || '',
      exitMinute: finalUpdates.exitMinute || '',
      isWorking: finalUpdates.isWorking ?? true,
      forceOvertime: finalUpdates.forceOvertime ?? false,
      hoursWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      extraHours: 0,
      dailyPay: 0
    })

    savingDays.value.delete(dayKey)
    delete localSchedules.value[dayKey]
    delete saveTimers.value[dayKey]
  }, delay)
}

// Función para convertir string (hora, minuto) a Time object
const stringToTime = (hour: string, minute: string): Time | null => {
  if (!hour || !minute) return null
  const h = parseInt(hour)
  const m = parseInt(minute)
  if (isNaN(h) || isNaN(m)) return null
  return new Time(h, m, 0)
}


const getEntryTime = (dayKey: string): Time | null => {
  const localSchedule = localSchedules.value[dayKey]
  const schedule = props.week.schedule[dayKey as keyof WeekSchedule]

  const entryHour = localSchedule?.entryHour ?? schedule.entryHour
  const entryMinute = localSchedule?.entryMinute ?? schedule.entryMinute

  return stringToTime(entryHour, entryMinute)
}

const setEntryTime = (dayKey: string, value: Time | null) => {
  let entryHour = ''
  let entryMinute = ''

  if (value) {
    entryHour = value.hour.toString().padStart(2, '0')
    entryMinute = value.minute.toString().padStart(2, '0')
  }

  // Guardar con debouncing
  debouncedSave(dayKey, { entryHour, entryMinute })
}

// Función para obtener el tiempo de salida de un día (con estado local)
const getExitTime = (dayKey: string): Time | null => {
  const localSchedule = localSchedules.value[dayKey]
  const schedule = props.week.schedule[dayKey as keyof WeekSchedule]

  const exitHour = localSchedule?.exitHour ?? schedule.exitHour
  const exitMinute = localSchedule?.exitMinute ?? schedule.exitMinute

  return stringToTime(exitHour, exitMinute)
}

// Función para establecer el tiempo de salida de un día (con debouncing)
const setExitTime = (dayKey: string, value: Time | null) => {
  let exitHour = ''
  let exitMinute = ''

  if (value) {
    exitHour = value.hour.toString().padStart(2, '0')
    exitMinute = value.minute.toString().padStart(2, '0')
  }

  // Guardar con debouncing
  debouncedSave(dayKey, { exitHour, exitMinute })
}

// Función para obtener el estado de forceOvertime de un día
const getForceOvertime = (dayKey: string): boolean => {
  const localSchedule = localSchedules.value[dayKey]
  const schedule = props.week.schedule[dayKey as keyof WeekSchedule]
  return localSchedule?.forceOvertime ?? schedule.forceOvertime ?? false
}

// Función para actualizar forceOvertime con debouncing
const setForceOvertime = (dayKey: string, value: boolean) => {
  debouncedSave(dayKey, { forceOvertime: value })
}

// Presets de horarios comunes
const schedulePresets = [
  { label: '16:00 - 01:00', entry: { hour: '16', minute: '00' }, exit: { hour: '01', minute: '00' } },
  { label: '10:00 - 19:00', entry: { hour: '10', minute: '00' }, exit: { hour: '19', minute: '00' } },
  { label: '8:00 - 17:00', entry: { hour: '08', minute: '00' }, exit: { hour: '17', minute: '00' } },
  { label: '11:00 - 20:00', entry: { hour: '11', minute: '00' }, exit: { hour: '20', minute: '00' } },
]

const selectedDays = ref<Set<string>>(new Set())
const showCopyDialog = ref(false)
const sourceDayForCopy = ref<string>('')

const formatDate = (dateStr: string) => {
  return formatWeekDisplay(dateStr)
}

// Calcular horas en el local (incluyendo descanso) para un día específico
const calculateHoursInPlace = (dayKey: string): number => {
  const schedule = props.week.schedule[dayKey as keyof WeekSchedule]
  const { entryHour, entryMinute, exitHour, exitMinute } = schedule

  if (!entryHour || !entryMinute || !exitHour || !exitMinute) return 0

  const entryTime = parseInt(entryHour) + parseInt(entryMinute) / 60
  let exitTime = parseInt(exitHour) + parseInt(exitMinute) / 60

  // Manejar turnos nocturnos
  if (exitTime <= entryTime) {
    exitTime += 24
  }

  return exitTime - entryTime
}

// Verificar si el descanso se está deduciendo para este día
const isBreakDeducted = (dayKey: string): boolean => {
  const hoursInPlace = calculateHoursInPlace(dayKey)
  return hoursInPlace >= 5  // MIN_HOURS_FOR_BREAK
}

// Aplicar preset a un día
const applyPreset = async (dayKey: string, preset: typeof schedulePresets[0], showToastMessage = true) => {
  const result = await payrollStore.updateDaySchedule(dayKey as keyof WeekSchedule, {
    entryHour: preset.entry.hour,
    entryMinute: preset.entry.minute,
    exitHour: preset.exit.hour,
    exitMinute: preset.exit.minute,
    isWorking: true,
    hoursWorked: 0,
    regularHours: 0,
    overtimeHours: 0,
    extraHours: 0,
    dailyPay: 0
  })

  if (result.success && showToastMessage) {
    toast.add({
      title: 'Horario aplicado',
      description: `${preset.label} aplicado correctamente`,
      color: 'success'
    })
  }
}

// Aplicar preset a todos los días (optimizado: un solo PATCH)
const applyPresetToAll = async (preset: typeof schedulePresets[0]) => {
  bulkSaving.value = true

  // Construir objeto con todos los días para un solo PATCH
  const scheduleUpdates: Record<string, any> = {}
  for (const day of WEEK_DAYS) {
    scheduleUpdates[day.key] = {
      entryHour: preset.entry.hour,
      entryMinute: preset.entry.minute,
      exitHour: preset.exit.hour,
      exitMinute: preset.exit.minute,
      isWorking: true
    }
  }

  // Hacer un solo PATCH con todos los días
  const api = usePayrollApi()
  if (!payrollStore.currentEmployeeId || !payrollStore.currentWeekId) {
    bulkSaving.value = false
    return
  }

  try {
    await api.updateWeekSchedule(
      payrollStore.currentEmployeeId,
      payrollStore.currentWeekId,
      scheduleUpdates
    )

    // Actualizar el store para refrescar los datos
    await payrollStore.fetchEmployees()

    toast.add({
      title: 'Horarios aplicados',
      description: `${preset.label} aplicado a toda la semana`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'No se pudieron aplicar los horarios',
      color: 'error'
    })
  } finally {
    bulkSaving.value = false
  }
}

// Copiar horario de un día
const copyDay = (dayKey: string) => {
  sourceDayForCopy.value = dayKey
  selectedDays.value = new Set()
  showCopyDialog.value = true
}

// Aplicar copia a días seleccionados (optimizado: un solo PATCH)
const applyCopy = async () => {
  if (!sourceDayForCopy.value || selectedDays.value.size === 0) return

  bulkSaving.value = true
  const sourceSchedule = props.week.schedule[sourceDayForCopy.value as keyof WeekSchedule]

  // Construir objeto con los días seleccionados para un solo PATCH
  const scheduleUpdates: Record<string, any> = {}
  for (const targetDay of Array.from(selectedDays.value)) {
    scheduleUpdates[targetDay] = {
      entryHour: sourceSchedule.entryHour,
      entryMinute: sourceSchedule.entryMinute,
      exitHour: sourceSchedule.exitHour,
      exitMinute: sourceSchedule.exitMinute,
      isWorking: true
    }
  }

  // Hacer un solo PATCH con todos los días seleccionados
  const api = usePayrollApi()
  if (!payrollStore.currentEmployeeId || !payrollStore.currentWeekId) {
    bulkSaving.value = false
    return
  }

  try {
    await api.updateWeekSchedule(
      payrollStore.currentEmployeeId,
      payrollStore.currentWeekId,
      scheduleUpdates
    )

    // Actualizar el store para refrescar los datos
    await payrollStore.fetchEmployees()

    toast.add({
      title: 'Horarios copiados',
      description: `Horario copiado a ${selectedDays.value.size} día(s)`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'No se pudieron copiar los horarios',
      color: 'error'
    })
  } finally {
    bulkSaving.value = false
    showCopyDialog.value = false
    selectedDays.value = new Set()
  }
}

// Limpiar un día
const clearDay = async (dayKey: string) => {
  await payrollStore.updateDaySchedule(dayKey as keyof WeekSchedule, {
    entryHour: '',
    entryMinute: '',
    exitHour: '',
    exitMinute: '',
    isWorking: false,
    hoursWorked: 0,
    regularHours: 0,
    overtimeHours: 0,
    extraHours: 0,
    dailyPay: 0
  })

  toast.add({
    title: 'Día limpiado',
    description: 'Horario eliminado correctamente',
    color: 'success'
  })
}

// Toggle selección de día
const toggleDaySelection = (dayKey: string) => {
  if (selectedDays.value.has(dayKey)) {
    selectedDays.value.delete(dayKey)
  } else {
    selectedDays.value.add(dayKey)
  }
}

// Verificar si un día tiene datos
const hasDayData = (dayKey: string) => {
  const schedule = props.week.schedule?.[dayKey as keyof WeekSchedule]
  if (!schedule) return false
  return schedule.hoursWorked > 0 || (schedule.entryHour && schedule.exitHour)
}

// Helper seguro para obtener el schedule de un día con valores por defecto
const getDaySchedule = (dayKey: string): DaySchedule => {
  const schedule = props.week.schedule?.[dayKey as keyof WeekSchedule]
  if (!schedule) {
    return {
      entryHour: '',
      entryMinute: '',
      exitHour: '',
      exitMinute: '',
      hoursWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      extraHours: 0,
      dailyPay: 0,
      isWorking: false,
      forceOvertime: false
    }
  }
  return schedule
}
</script>

<style scoped>
.day-card {
  transition: all 0.2s ease;
}

.day-card:hover {
  transform: translateY(-1px);
}
</style>

<template>
  <UCard class="bg-white dark:bg-gray-800 shadow-lg border border-emerald-100 dark:border-emerald-900">
    <template #header>
      <div class="space-y-4">
        <!-- Título -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-calendar-clock" class="size-5 text-emerald-600" />
            <h2 class="text-lg font-semibold">Horarios - {{ employeeName }}</h2>
            <!-- Indicador de operación masiva -->
            <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
              <div v-if="bulkSaving"
                class="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <UIcon name="i-lucide-loader-2" class="size-4 text-blue-600 animate-spin" />
                <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Aplicando cambios...</span>
              </div>
            </Transition>
            <UPopover mode="hover">
              <UButton icon="i-lucide-info" size="xs" color="blue" variant="ghost" />
              <template #panel>
                <div class="p-3 max-w-xs">
                  <div class="flex items-start gap-2 mb-2">
                    <UIcon name="i-lucide-coffee" class="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p class="text-sm font-semibold text-blue-900 dark:text-blue-100">Política de Descanso</p>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Si trabajas <strong>5 horas o más</strong>, se deduce automáticamente 1 hora de descanso
                        obligatorio. Turnos menores a 5 horas no tienen descuento.
                      </p>
                    </div>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
          <p class="text-sm text-gray-500">Semana del {{ formatDate(week.startDate) }}</p>
        </div>

        <div
          class="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 sm:p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <span
            class="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap flex-shrink-0">
            Quick Fill
          </span>
          <div class="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button v-for="preset in schedulePresets" :key="preset.label" @click="applyPresetToAll(preset)"
              :disabled="bulkSaving"
              class="px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md transition-colors whitespace-nowrap touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed">
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Day Cards - Compacto y Responsive -->
    <div class="space-y-2">
      <div v-for="day in WEEK_DAYS" :key="day.key" :class="[
        'day-card p-2 rounded-lg border',
        hasDayData(day.key)
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700'
      ]">

        <!-- Header: Day + Actions - Mobile Optimized -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span class="text-xl sm:text-2xl flex-shrink-0">{{ day.emoji }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 truncate">{{ day.name }}
                </h3>
                <!-- Indicador de guardado -->
                <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
                  enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200"
                  leave-from-class="opacity-100" leave-to-class="opacity-0">
                  <div v-if="savingDays.has(day.key)" class="flex items-center gap-1">
                    <UIcon name="i-lucide-loader-2" class="size-3 text-blue-600 animate-spin" />
                    <span class="text-xs text-blue-600">Guardando...</span>
                  </div>
                </Transition>
              </div>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {{ getDaySchedule(day.key).hoursWorked.toFixed(1) }}h trabajadas
              </p>
            </div>
          </div>

          <!-- Actions - Touch Optimized -->
          <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button @click="copyDay(day.key)"
              class="p-2 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 rounded transition-colors touch-manipulation"
              title="Copiar horario">
              <UIcon name="i-lucide-copy" class="size-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button @click="clearDay(day.key)"
              class="p-2 hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900/20 dark:active:bg-red-900/40 rounded transition-colors touch-manipulation"
              title="Limpiar día">
              <UIcon name="i-lucide-trash-2" class="size-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap gap-1 mb-2">
          <button v-for="preset in schedulePresets" :key="preset.label" @click="applyPreset(day.key, preset)"
            class="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-emerald-600 hover:text-white border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded transition-all"
            title="Quick fill">
            {{ preset.label }}
          </button>
        </div>

        <!-- Time Inputs - Responsive Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <!-- Entry Time -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Entrada
            </label>
            <UInputTime :model-value="getEntryTime(day.key)" icon="i-lucide-clock"
              @update:model-value="(value) => setEntryTime(day.key, value)" size="sm" />
          </div>

          <!-- Exit Time -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Salida
            </label>
            <UInputTime :model-value="getExitTime(day.key)" @update:model-value="(value) => setExitTime(day.key, value)"
              icon="i-lucide-clock" size="sm" />
          </div>
        </div>

        <!-- Force Overtime Checkbox - Solo para Lunes -->
        <div v-if="day.key === 'monday'" class="mt-2 mb-2">
          <label :class="[
            'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all',
            getForceOvertime(day.key)
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
              : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-600'
          ]">
            <input
              type="checkbox"
              :checked="getForceOvertime(day.key)"
              @change="(e) => setForceOvertime(day.key, (e.target as HTMLInputElement).checked)"
              class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
            />
            <div class="flex items-center gap-1.5 flex-1">
              <UIcon name="i-lucide-zap" :class="[
                'size-4',
                getForceOvertime(day.key) ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
              ]" />
              <span :class="[
                'text-xs font-medium',
                getForceOvertime(day.key) ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'
              ]">
                Marcar horas después de 1 AM como extras
              </span>
            </div>
            <div v-if="getForceOvertime(day.key)"
              class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded text-xs font-bold text-amber-700 dark:text-amber-300">
              ACTIVO
            </div>
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
            00:00-01:00 = regular, 01:00+ = overtime (continuación del domingo)
          </p>
        </div>

        <!-- Results - Responsive -->
        <div v-if="hasDayData(day.key)" class="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">

          <!-- Break Time Indicator -->
          <div v-if="isBreakDeducted(day.key)"
            class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
            <UIcon name="i-lucide-coffee" class="size-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span class="text-xs text-blue-700 dark:text-blue-300">
              <span class="font-semibold">1h descanso</span> ·
              {{ calculateHoursInPlace(day.key).toFixed(1) }}h → {{ getDaySchedule(day.key).hoursWorked.toFixed(1) }}h
              pagadas
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div
              class="px-3 py-2 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-200 dark:border-violet-800">
              <div class="text-xs text-violet-600 dark:text-violet-400 font-semibold mb-0.5">Total</div>
              <div class="text-lg font-bold text-violet-600 dark:text-violet-400">
                {{ formatCurrency(getDaySchedule(day.key).dailyPay, 'MXN') }}
              </div>
            </div>

            <div class="flex gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Regular: </span>
                <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{
                  getDaySchedule(day.key).regularHours.toFixed(1) }}h</span>
              </div>
              <div v-if="getDaySchedule(day.key).overtimeHours > 0">
                <span class="text-gray-500 dark:text-gray-400">Extra 1.5x: </span>
                <span class="font-semibold text-amber-600 dark:text-amber-400">{{
                  getDaySchedule(day.key).overtimeHours.toFixed(1) }}h</span>
              </div>
              <div v-if="getDaySchedule(day.key).extraHours > 0">
                <span class="text-gray-500 dark:text-gray-400">Extra 2x: </span>
                <span class="font-semibold text-red-600 dark:text-red-400">{{
                  getDaySchedule(day.key).extraHours.toFixed(1)
                }}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>

  <!-- Copy Modal -->
  <UModal v-model:open="showCopyDialog" title="Copiar Horario" description="Selecciona los días destino">
    <template #body>
      <div class="space-y-2">
        <label v-for="day in WEEK_DAYS" :key="day.key" v-if="day.key !== sourceDayForCopy" :class="[
          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
          selectedDays.has(day.key)
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-500'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
        ]">
          <input type="checkbox" :checked="selectedDays.has(day.key)" @change="toggleDaySelection(day.key)"
            class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
          <span class="text-xl">{{ day.emoji }}</span>
          <span class="font-medium text-gray-800 dark:text-gray-100">{{ day.name }}</span>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Cancelar" color="gray" variant="ghost" @click="showCopyDialog = false" />
        <UButton :label="`Copiar a ${selectedDays.size} día(s)`" icon="i-lucide-copy" color="primary" @click="applyCopy"
          :disabled="selectedDays.size === 0" />
      </div>
    </template>
  </UModal>
</template>
