import { defineStore } from 'pinia'
import type { PayrollEmployee, PayrollWeek, DaySchedule, WeekSchedule, EmployeeSettings } from '~/types/payroll'
import type { EmployeeListItem } from '~/composables/usePayrollApi'
import { calculateWeekTotals } from '~/utils/payrollCalculations'
import { handleApiError } from '~/utils/errorHandler'

/**
 * Store de Pinia para el módulo de Nóminas (Setup Syntax)
 *
 * Maneja el estado y las acciones relacionadas con empleados de nómina,
 * semanas laborales y horarios. Utiliza el patrón Repository a través
 * de usePayrollApi para todas las operaciones con el backend.
 *
 * employeeList: lista ligera (id, name) para el selector
 * currentEmployee: datos completos del empleado seleccionado (cargado on demand)
 */
export const usePayrollStore = defineStore('payroll', () => {
  // ===== STATE =====
  const employeeList = ref<EmployeeListItem[]>([])
  const currentEmployeeId = ref('')
  const currentEmployee = ref<PayrollEmployee | null>(null)
  const currentWeekId = ref('')
  const activeTab = ref('schedules')
  const loading = ref(false)
  const loadingEmployee = ref(false)
  const error = ref<string | undefined>(undefined)

  // ===== GETTERS (Computed) =====

  const currentEmployeeWeeks = computed<PayrollWeek[]>(() => {
    return currentEmployee.value?.weeks || []
  })

  const currentWeek = computed<PayrollWeek | null>(() => {
    if (!currentEmployee.value || !currentWeekId.value) return null
    return currentEmployee.value.weeks.find(week => week.id === currentWeekId.value) || null
  })

  const weekTotals = computed(() => {
    if (!currentWeek.value) {
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

    return calculateWeekTotals(currentWeek.value)
  })

  // ===== ACTIONS (Functions) =====

  // --- CRUD: EMPLEADOS ---

  async function fetchEmployees() {
    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      employeeList.value = await api.fetchEmployees()

      if (!currentEmployeeId.value || !employeeList.value.find(e => e.id === currentEmployeeId.value)) {
        currentEmployeeId.value = employeeList.value.length > 0 ? employeeList.value[0]?.id || '' : ''
      }

      if (currentEmployeeId.value) {
        await fetchCurrentEmployee()
      }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'fetchEmployees')
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentEmployee() {
    if (!currentEmployeeId.value) return

    loadingEmployee.value = true
    try {
      const api = usePayrollApi()
      currentEmployee.value = await api.fetchEmployee(currentEmployeeId.value)
    } catch (err: unknown) {
      handleApiError(err, 'fetchCurrentEmployee')
    } finally {
      loadingEmployee.value = false
    }
  }

  async function createEmployee(
    name: string,
    baseHourlyRate: number,
    currency: string = 'MXN'
  ): Promise<{ success: boolean, error?: string }> {
    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      const newEmployee = await api.createEmployee({
        name: name.trim(),
        base_hourly_rate: baseHourlyRate,
        currency
      })

      employeeList.value.push({ id: newEmployee.id, name: newEmployee.name })
      currentEmployeeId.value = newEmployee.id
      currentEmployee.value = newEmployee
      currentWeekId.value = ''

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'createEmployee')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateEmployeeSettings(
    settings: Partial<EmployeeSettings>
  ): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value) {
      return { success: false, error: 'No hay empleado seleccionado' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      const updatedEmployee = await api.updateEmployee(currentEmployeeId.value, { settings })
      currentEmployee.value = updatedEmployee

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'updateEmployeeSettings')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function deleteCurrentEmployee(): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value) {
      return { success: false, error: 'No hay empleado seleccionado' }
    }

    if (employeeList.value.length <= 1) {
      return { success: false, error: 'No puedes eliminar el último empleado' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      await api.deleteEmployee(currentEmployeeId.value)

      const index = employeeList.value.findIndex(e => e.id === currentEmployeeId.value)
      if (index !== -1) {
        employeeList.value.splice(index, 1)
      }

      currentEmployeeId.value = employeeList.value.length > 0 ? employeeList.value[0]?.id || '' : ''
      currentWeekId.value = ''
      await fetchCurrentEmployee()

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'deleteCurrentEmployee')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function onEmployeeChange(): Promise<void> {
    currentWeekId.value = ''
    await fetchCurrentEmployee()
  }

  // --- CRUD: SEMANAS ---

  async function createWeek(
    startDate: string,
    weeklyTips: number = 0
  ): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value) {
      return { success: false, error: 'No hay empleado seleccionado' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      const newWeek = await api.createWeek(currentEmployeeId.value, {
        start_date: startDate,
        weekly_tips: weeklyTips
      })

      if (currentEmployee.value) {
        currentEmployee.value.weeks.push(newWeek)
        currentWeekId.value = newWeek.id
      }

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'createWeek')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateDaySchedule(
    dayKey: keyof WeekSchedule,
    schedule: Partial<DaySchedule>
  ): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value || !currentWeekId.value) {
      return { success: false, error: 'No hay empleado o semana seleccionada' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()

      const rawSchedule = {
        entryHour: schedule.entryHour,
        entryMinute: schedule.entryMinute,
        exitHour: schedule.exitHour,
        exitMinute: schedule.exitMinute,
        isWorking: schedule.isWorking ?? true,
        forceOvertime: schedule.forceOvertime ?? false,
        breakHours: schedule.breakHours ?? null
      }

      const updatedWeek = await api.updateWeekSchedule(
        currentEmployeeId.value,
        currentWeekId.value,
        { [dayKey]: rawSchedule }
      )

      if (currentEmployee.value) {
        const weekIndex = currentEmployee.value.weeks.findIndex(w => w.id === currentWeekId.value)
        if (weekIndex !== -1) {
          currentEmployee.value.weeks[weekIndex] = updatedWeek
        }
      }

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'updateDaySchedule')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateWeeklyTips(tips: number): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value || !currentWeekId.value) {
      return { success: false, error: 'No hay empleado o semana seleccionada' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      const updatedWeek = await api.updateWeek(
        currentEmployeeId.value,
        currentWeekId.value,
        { weekly_tips: tips }
      )

      if (currentEmployee.value) {
        const weekIndex = currentEmployee.value.weeks.findIndex(w => w.id === currentWeekId.value)
        if (weekIndex !== -1) {
          currentEmployee.value.weeks[weekIndex] = updatedWeek
        }
      }

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'updateWeeklyTips')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateShiftRate(shiftRate: number | null): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value || !currentWeekId.value) {
      return { success: false, error: 'No hay empleado o semana seleccionada' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      const updatedWeek = await api.updateWeek(
        currentEmployeeId.value,
        currentWeekId.value,
        { shift_rate: shiftRate }
      )

      if (currentEmployee.value) {
        const weekIndex = currentEmployee.value.weeks.findIndex(w => w.id === currentWeekId.value)
        if (weekIndex !== -1) {
          currentEmployee.value.weeks[weekIndex] = updatedWeek
        }
      }

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'updateShiftRate')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function deleteCurrentWeek(): Promise<{ success: boolean, error?: string }> {
    if (!currentEmployeeId.value || !currentWeekId.value) {
      return { success: false, error: 'No hay empleado o semana seleccionada' }
    }

    loading.value = true
    error.value = undefined

    try {
      const api = usePayrollApi()
      await api.deleteWeek(currentEmployeeId.value, currentWeekId.value)

      if (currentEmployee.value) {
        const weekIndex = currentEmployee.value.weeks.findIndex(w => w.id === currentWeekId.value)
        if (weekIndex !== -1) {
          currentEmployee.value.weeks.splice(weekIndex, 1)
        }
      }

      currentWeekId.value = ''

      return { success: true }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'deleteCurrentWeek')
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ===== RETURN PUBLIC API =====
  return {
    // State
    employeeList,
    currentEmployeeId,
    currentEmployee,
    currentWeekId,
    activeTab,
    loading,
    loadingEmployee,
    error,
    // Getters
    currentEmployeeWeeks,
    currentWeek,
    weekTotals,
    // Actions
    fetchEmployees,
    fetchCurrentEmployee,
    createEmployee,
    updateEmployeeSettings,
    deleteCurrentEmployee,
    onEmployeeChange,
    createWeek,
    updateDaySchedule,
    updateWeeklyTips,
    updateShiftRate,
    deleteCurrentWeek
  }
})
