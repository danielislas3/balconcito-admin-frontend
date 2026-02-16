import { describe, it, expect } from 'vitest'
import { calculateWeekTotals, calculateEmployeeStats } from '~/utils/payrollCalculations'
import type { PayrollWeek, PayrollEmployee, DaySchedule, WeekSchedule } from '~/types/payroll'

// ── Helpers ───────────────────────────────────────────────────────────────

function makeSchedule(days: Partial<Record<keyof WeekSchedule, Partial<DaySchedule>>>): WeekSchedule {
  const defaultDay: DaySchedule = {
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

  return {
    monday: { ...defaultDay, ...days.monday },
    tuesday: { ...defaultDay, ...days.tuesday },
    wednesday: { ...defaultDay, ...days.wednesday },
    thursday: { ...defaultDay, ...days.thursday },
    friday: { ...defaultDay, ...days.friday },
    saturday: { ...defaultDay, ...days.saturday },
    sunday: { ...defaultDay, ...days.sunday }
  }
}

function makeWeek(overrides: Partial<PayrollWeek> = {}): PayrollWeek {
  return {
    id: '2026-W07',
    startDate: '2026-02-09',
    weeklyTips: 0,
    schedule: makeSchedule({}),
    ...overrides
  }
}

function makeWorkDay(hours: number, pay: number, overtime = 0, extra = 0): Partial<DaySchedule> {
  return {
    isWorking: true,
    hoursWorked: hours,
    regularHours: hours - overtime - extra,
    overtimeHours: overtime,
    extraHours: extra,
    dailyPay: pay
  }
}

// ── calculateWeekTotals ───────────────────────────────────────────────────

describe('calculateWeekTotals', () => {
  it('devuelve 0s para semana sin días trabajados', () => {
    const week = makeWeek()
    const totals = calculateWeekTotals(week)

    expect(totals.totalHours).toBe(0)
    expect(totals.regularHours).toBe(0)
    expect(totals.overtimeHours).toBe(0)
    expect(totals.extraHours).toBe(0)
    expect(totals.totalBasePay).toBe(0)
    expect(totals.totalPay).toBe(0)
    expect(totals.totalShifts).toBe(0)
    expect(totals.totalOvertimeHours).toBe(0)
  })

  it('suma correctamente una semana de 6 turnos de 8h', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(8, 3600),
      tuesday: makeWorkDay(8, 3600),
      wednesday: makeWorkDay(8, 3600),
      thursday: makeWorkDay(8, 3600),
      friday: makeWorkDay(8, 3600),
      saturday: makeWorkDay(8, 3600)
    })

    const totals = calculateWeekTotals(makeWeek({ schedule }))

    expect(totals.totalHours).toBe(48)
    expect(totals.regularHours).toBe(48)
    expect(totals.totalBasePay).toBe(21600)
    expect(totals.totalShifts).toBe(6)
  })

  it('incluye weeklyTips en totalPay', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(8, 3600)
    })

    const totals = calculateWeekTotals(makeWeek({ schedule, weeklyTips: 500 }))

    expect(totals.totalBasePay).toBe(3600)
    expect(totals.totalPay).toBe(4100)
  })

  it('acumula overtime y extra hours', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(10, 4950, 2, 0),
      tuesday: makeWorkDay(12, 6750, 2, 2)
    })

    const totals = calculateWeekTotals(makeWeek({ schedule }))

    expect(totals.overtimeHours).toBe(4)
    expect(totals.extraHours).toBe(2)
    expect(totals.totalOvertimeHours).toBe(6) // tier1 + tier2
  })

  it('solo cuenta shifts de 8+ horas', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(8, 3600),
      tuesday: makeWorkDay(7.5, 3375),
      wednesday: makeWorkDay(4, 1800)
    })

    const totals = calculateWeekTotals(makeWeek({ schedule }))

    expect(totals.totalShifts).toBe(1) // solo monday
  })

  it('maneja weeklyTips 0 correctamente', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(8, 3600)
    })

    const totals = calculateWeekTotals(makeWeek({ schedule, weeklyTips: 0 }))

    expect(totals.totalPay).toBe(3600)
  })
})

// ── calculateEmployeeStats ────────────────────────────────────────────────

describe('calculateEmployeeStats', () => {
  it('devuelve 0s para empleado sin semanas', () => {
    const employee: PayrollEmployee = {
      id: 'EMP-001',
      name: 'Test',
      settings: {
        baseHourlyRate: 450,
        currency: 'MXN',
        usesOvertime: true,
        usesTips: true,
        overtimeTier1Rate: 1.5,
        overtimeTier2Rate: 2.0,
        overtimeTier1Hours: 2,
        hoursPerShift: 8,
        breakHours: 1,
        minHoursForBreak: 5
      },
      weeks: []
    }

    const stats = calculateEmployeeStats(employee)

    expect(stats.totalWeeks).toBe(0)
    expect(stats.totalShifts).toBe(0)
    expect(stats.totalHours).toBe(0)
    expect(stats.totalPay).toBe(0)
    expect(stats.avgHoursPerWeek).toBe(0)
    expect(stats.avgHoursPerShift).toBe(0)
  })

  it('calcula estadísticas para empleado con múltiples semanas', () => {
    const week1Schedule = makeSchedule({
      monday: makeWorkDay(8, 3600),
      tuesday: makeWorkDay(8, 3600),
      wednesday: makeWorkDay(8, 3600),
      thursday: makeWorkDay(8, 3600),
      friday: makeWorkDay(8, 3600),
      saturday: makeWorkDay(8, 3600)
    })

    const week2Schedule = makeSchedule({
      monday: makeWorkDay(8, 3600),
      tuesday: makeWorkDay(8, 3600),
      wednesday: makeWorkDay(8, 3600)
    })

    const employee: PayrollEmployee = {
      id: 'EMP-001',
      name: 'María',
      settings: {
        baseHourlyRate: 450,
        currency: 'MXN',
        usesOvertime: true,
        usesTips: true,
        overtimeTier1Rate: 1.5,
        overtimeTier2Rate: 2.0,
        overtimeTier1Hours: 2,
        hoursPerShift: 8,
        breakHours: 1,
        minHoursForBreak: 5
      },
      weeks: [
        makeWeek({ id: 'W1', schedule: week1Schedule, weeklyTips: 200 }),
        makeWeek({ id: 'W2', schedule: week2Schedule, weeklyTips: 100 })
      ]
    }

    const stats = calculateEmployeeStats(employee)

    expect(stats.totalWeeks).toBe(2)
    expect(stats.totalShifts).toBe(9) // 6 + 3
    expect(stats.totalHours).toBe(72) // 48 + 24
    expect(stats.totalPay).toBe(32700) // (21600+200) + (10800+100)
    expect(stats.avgHoursPerWeek).toBe(36) // 72/2
    expect(stats.avgHoursPerShift).toBe(8) // 72/9
  })

  it('calcula avgHoursPerShift correctamente con turnos mixtos', () => {
    const schedule = makeSchedule({
      monday: makeWorkDay(10, 4950, 2), // 8h shift (counts)
      tuesday: makeWorkDay(4, 1800) // 4h (no count)
    })

    const employee: PayrollEmployee = {
      id: 'EMP-001',
      name: 'Test',
      settings: {
        baseHourlyRate: 450,
        currency: 'MXN',
        usesOvertime: true,
        usesTips: true,
        overtimeTier1Rate: 1.5,
        overtimeTier2Rate: 2.0,
        overtimeTier1Hours: 2,
        hoursPerShift: 8,
        breakHours: 1,
        minHoursForBreak: 5
      },
      weeks: [makeWeek({ schedule })]
    }

    const stats = calculateEmployeeStats(employee)

    expect(stats.totalShifts).toBe(1) // solo monday (10h >= 8)
    expect(stats.totalHours).toBe(14) // 10 + 4
    expect(stats.avgHoursPerShift).toBe(14) // 14/1
  })
})
