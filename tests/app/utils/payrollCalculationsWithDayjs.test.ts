import { describe, it, expect, vi } from 'vitest'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

// Mock useDayjs
dayjs.locale('es')
vi.stubGlobal('useDayjs', () => dayjs)

import { calculateMonthlyStats, getAvailableMonths } from '~/utils/payrollCalculations'
import type { PayrollEmployee, PayrollWeek, DaySchedule, WeekSchedule } from '~/types/payroll'

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDefaultDay(): DaySchedule {
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

function makeSchedule(workDays: Partial<Record<keyof WeekSchedule, Partial<DaySchedule>>> = {}): WeekSchedule {
  const d = makeDefaultDay()
  return {
    monday: { ...d, ...workDays.monday },
    tuesday: { ...d, ...workDays.tuesday },
    wednesday: { ...d, ...workDays.wednesday },
    thursday: { ...d, ...workDays.thursday },
    friday: { ...d, ...workDays.friday },
    saturday: { ...d, ...workDays.saturday },
    sunday: { ...d, ...workDays.sunday }
  }
}

function makeWeek(startDate: string, tips = 0, dayPay = 3600): PayrollWeek {
  return {
    id: `W-${startDate}`,
    startDate,
    weeklyTips: tips,
    schedule: makeSchedule({
      monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: dayPay }
    })
  }
}

const defaultSettings = {
  baseHourlyRate: 450,
  currency: 'MXN' as const,
  usesOvertime: true,
  usesTips: true,
  overtimeTier1Rate: 1.5,
  overtimeTier2Rate: 2.0,
  overtimeTier1Hours: 2,
  hoursPerShift: 8,
  breakHours: 1,
  minHoursForBreak: 5
}

function makeEmployee(weeks: PayrollWeek[]): PayrollEmployee {
  return {
    id: 'EMP-001',
    name: 'María',
    settings: defaultSettings,
    weeks
  }
}

// ── calculateMonthlyStats ─────────────────────────────────────────────────

describe('calculateMonthlyStats', () => {
  it('devuelve null cuando no hay semanas en el mes', () => {
    const employee = makeEmployee([makeWeek('2026-02-09')])
    const result = calculateMonthlyStats(employee, 2026, 0) // enero

    expect(result).toBeNull()
  })

  it('calcula stats para un mes con semanas', () => {
    const employee = makeEmployee([
      makeWeek('2026-02-02', 100, 3600),
      makeWeek('2026-02-09', 200, 3600)
    ])

    const result = calculateMonthlyStats(employee, 2026, 1) // febrero (0-indexed)

    expect(result).not.toBeNull()
    expect(result!.year).toBe(2026)
    expect(result!.month).toBe(1)
    expect(result!.weeksCount).toBe(2)
    expect(result!.totalHours).toBe(16) // 8h * 2 weeks
    expect(result!.totalTips).toBe(300) // 100 + 200
    expect(result!.totalBasePay).toBe(7200) // 3600 * 2
    expect(result!.totalPay).toBe(7500) // 7200 + 300
  })

  it('filtra semanas de otros meses', () => {
    const employee = makeEmployee([
      makeWeek('2026-01-26', 100), // enero
      makeWeek('2026-02-02', 200), // febrero
      makeWeek('2026-03-02', 300) // marzo
    ])

    const result = calculateMonthlyStats(employee, 2026, 1) // febrero

    expect(result!.weeksCount).toBe(1)
    expect(result!.totalTips).toBe(200)
  })

  it('calcula promedios por semana', () => {
    const employee = makeEmployee([
      makeWeek('2026-02-02', 0, 3600),
      makeWeek('2026-02-09', 0, 4000)
    ])

    const result = calculateMonthlyStats(employee, 2026, 1)

    expect(result!.avgHoursPerWeek).toBe(8) // 16/2
    expect(result!.avgPayPerWeek).toBe(3800) // 7600/2
  })
})

// ── getAvailableMonths ────────────────────────────────────────────────────

describe('getAvailableMonths', () => {
  it('devuelve array vacío para empleado sin semanas', () => {
    const employee = makeEmployee([])
    expect(getAvailableMonths(employee)).toEqual([])
  })

  it('devuelve meses únicos ordenados de reciente a antiguo', () => {
    const employee = makeEmployee([
      makeWeek('2026-01-05'),
      makeWeek('2026-01-12'),
      makeWeek('2026-02-02'),
      makeWeek('2025-12-01')
    ])

    const months = getAvailableMonths(employee)

    expect(months).toHaveLength(3) // dic 2025, ene 2026, feb 2026
    expect(months[0]!.year).toBe(2026)
    expect(months[0]!.month).toBe(1) // febrero
    expect(months[1]!.year).toBe(2026)
    expect(months[1]!.month).toBe(0) // enero
    expect(months[2]!.year).toBe(2025)
    expect(months[2]!.month).toBe(11) // diciembre
  })

  it('no duplica meses con múltiples semanas', () => {
    const employee = makeEmployee([
      makeWeek('2026-02-02'),
      makeWeek('2026-02-09'),
      makeWeek('2026-02-16')
    ])

    const months = getAvailableMonths(employee)

    expect(months).toHaveLength(1)
    expect(months[0]!.month).toBe(1) // febrero
  })

  it('incluye label formateado en español', () => {
    const employee = makeEmployee([makeWeek('2026-02-02')])
    const months = getAvailableMonths(employee)

    expect(months[0]!.label).toBe('febrero 2026')
  })
})
