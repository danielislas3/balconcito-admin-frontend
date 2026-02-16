// ── Types ──────────────────────────────────────────────────────────────────

export interface DayInput {
  entryHour: string
  entryMinute: string
  exitHour: string
  exitMinute: string
  isWorking: boolean
  forceOvertime?: boolean
  breakHours?: number | null
}

export interface EmployeeSettings {
  baseHourlyRate: number
  usesOvertime: boolean
  overtimeTier1Rate: number
  overtimeTier2Rate: number
  overtimeTier1Hours: number
  hoursPerShift: number
  breakHours: number
  minHoursForBreak: number
}

export interface DayResult {
  hoursWorked: number
  regularHours: number
  overtimeHours: number
  extraHours: number
  dailyPay: number
}

export interface WeekAggregates {
  totalHours: number
  totalRegularHours: number
  totalOvertimeHours: number
  totalExtraHours: number
  totalBasePay: number
  totalPay: number
  totalShifts: number
}

// ── Day calculation ────────────────────────────────────────────────────────

const OVERTIME_THRESHOLD_MINUTES = 20

export function calculateDayHoursAndPay(
  day: DayInput,
  settings: EmployeeSettings,
  shiftRate?: number | null
): DayResult {
  const empty: DayResult = {
    hoursWorked: 0,
    regularHours: 0,
    overtimeHours: 0,
    extraHours: 0,
    dailyPay: 0
  }

  if (!day.isWorking) return empty

  const entryH = parseInt(day.entryHour) || 0
  const entryM = parseInt(day.entryMinute) || 0
  const exitH = parseInt(day.exitHour) || 0
  const exitM = parseInt(day.exitMinute) || 0

  let entryMinutes = entryH * 60 + entryM
  let exitMinutes = exitH * 60 + exitM

  // Overnight shift: exit is next day
  if (exitMinutes <= entryMinutes) {
    exitMinutes += 24 * 60
  }

  let totalMinutes = exitMinutes - entryMinutes

  // Subtract break hours
  const effectiveBreak = day.breakHours != null ? day.breakHours : settings.breakHours
  const hoursBeforeBreak = totalMinutes / 60
  if (hoursBeforeBreak >= settings.minHoursForBreak && effectiveBreak > 0) {
    totalMinutes -= effectiveBreak * 60
  }

  if (totalMinutes <= 0) return empty

  const hoursWorked = round2(totalMinutes / 60)

  let regularHours: number
  let overtimeHours = 0
  let extraHours = 0

  if (day.forceOvertime) {
    // Force overtime mode (Monday overnight): 00:00-01:00 is regular, rest is overtime
    // Entry is typically 00:00 for forced overtime context
    const regularMinutes = Math.min(60, totalMinutes)
    regularHours = round2(regularMinutes / 60)

    const remainingMinutes = totalMinutes - regularMinutes
    if (remainingMinutes > OVERTIME_THRESHOLD_MINUTES && settings.usesOvertime) {
      const otMinutes = remainingMinutes
      const tier1Minutes = Math.min(otMinutes, settings.overtimeTier1Hours * 60)
      overtimeHours = round2(tier1Minutes / 60)
      extraHours = round2(Math.max(otMinutes - tier1Minutes, 0) / 60)
    } else {
      regularHours = hoursWorked
    }
  } else if (settings.usesOvertime) {
    regularHours = round2(Math.min(hoursWorked, settings.hoursPerShift))
    const excessHours = Math.max(hoursWorked - settings.hoursPerShift, 0)

    if (excessHours * 60 > OVERTIME_THRESHOLD_MINUTES) {
      overtimeHours = round2(Math.min(excessHours, settings.overtimeTier1Hours))
      extraHours = round2(Math.max(excessHours - settings.overtimeTier1Hours, 0))
    }
  } else {
    regularHours = hoursWorked
  }

  // Calculate pay
  let dailyPay: number

  if (shiftRate != null && shiftRate > 0) {
    // Fixed shift rate
    dailyPay = shiftRate
  } else {
    const rate = settings.baseHourlyRate
    dailyPay = round2(
      regularHours * rate
      + overtimeHours * rate * settings.overtimeTier1Rate
      + extraHours * rate * settings.overtimeTier2Rate
    )
  }

  return {
    hoursWorked,
    regularHours,
    overtimeHours,
    extraHours,
    dailyPay
  }
}

// ── Week aggregates ────────────────────────────────────────────────────────

export function calculateWeekAggregates(
  days: DayResult[],
  weeklyTips: number
): WeekAggregates {
  let totalHours = 0
  let totalRegularHours = 0
  let totalOvertimeHours = 0
  let totalExtraHours = 0
  let totalBasePay = 0
  let totalShifts = 0

  for (const day of days) {
    totalHours += day.hoursWorked
    totalRegularHours += day.regularHours
    totalOvertimeHours += day.overtimeHours
    totalExtraHours += day.extraHours
    totalBasePay += day.dailyPay
    if (day.hoursWorked >= 8) totalShifts++
  }

  return {
    totalHours: round2(totalHours),
    totalRegularHours: round2(totalRegularHours),
    totalOvertimeHours: round2(totalOvertimeHours),
    totalExtraHours: round2(totalExtraHours),
    totalBasePay: round2(totalBasePay),
    totalPay: round2(totalBasePay + weeklyTips),
    totalShifts
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
