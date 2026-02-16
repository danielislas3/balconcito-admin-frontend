const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type DbEmployee = {
  id: bigint
  name: string
  employeeId: string
  baseHourlyRate: string
  currency: string
  usesOvertime: boolean
  usesTips: boolean
  overtimeTier1Rate: string | null
  overtimeTier2Rate: string | null
  overtimeTier1Hours: number | null
  hoursPerShift: number | null
  breakHours: number | null
  minHoursForBreak: number | null
}

type DbWeek = {
  id: bigint
  weekId: string
  startDate: string
  weeklyTips: string | null
  shiftRate: string | null
}

type DbDay = {
  dayKey: string
  entryHour: string | null
  entryMinute: string | null
  exitHour: string | null
  exitMinute: string | null
  hoursWorked: string | null
  regularHours: string | null
  overtimeHours: string | null
  extraHours: string | null
  dailyPay: string | null
  isWorking: boolean | null
  forceOvertime: boolean
  breakHours: string | null
}

export function transformEmployee(emp: DbEmployee, weeks: ReturnType<typeof transformWeek>[] = []) {
  return {
    id: emp.employeeId,
    name: emp.name,
    settings: {
      ...getEmployeeSettings(emp),
      currency: emp.currency || 'MXN',
      usesTips: emp.usesTips
    },
    weeks
  }
}

export function transformWeek(week: DbWeek, days: DbDay[] = []) {
  const schedule: Record<string, Record<string, unknown>> = {}

  for (const key of DAY_KEYS) {
    const day = days.find(d => d.dayKey === key)
    schedule[key] = day
      ? {
          entryHour: day.entryHour || '',
          entryMinute: day.entryMinute || '',
          exitHour: day.exitHour || '',
          exitMinute: day.exitMinute || '',
          hoursWorked: parseFloat(day.hoursWorked || '0'),
          regularHours: parseFloat(day.regularHours || '0'),
          overtimeHours: parseFloat(day.overtimeHours || '0'),
          extraHours: parseFloat(day.extraHours || '0'),
          dailyPay: parseFloat(day.dailyPay || '0'),
          isWorking: day.isWorking ?? false,
          forceOvertime: day.forceOvertime,
          breakHours: day.breakHours != null ? parseFloat(day.breakHours) : undefined
        }
      : {
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

  return {
    id: week.weekId,
    startDate: week.startDate,
    weeklyTips: parseFloat(week.weeklyTips || '0'),
    shiftRate: week.shiftRate ? parseFloat(week.shiftRate) : undefined,
    schedule
  }
}

export function getEmployeeSettings(emp: DbEmployee): EmployeeSettings {
  return {
    baseHourlyRate: parseFloat(emp.baseHourlyRate) || 0,
    usesOvertime: emp.usesOvertime,
    overtimeTier1Rate: parseFloat(emp.overtimeTier1Rate || '1.5'),
    overtimeTier2Rate: parseFloat(emp.overtimeTier2Rate || '2.0'),
    overtimeTier1Hours: emp.overtimeTier1Hours ?? 2,
    hoursPerShift: emp.hoursPerShift ?? 8,
    breakHours: emp.breakHours ?? 1,
    minHoursForBreak: emp.minHoursForBreak ?? 5
  }
}

export { DAY_KEYS }
