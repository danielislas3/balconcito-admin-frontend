import { describe, it, expect, vi } from 'vitest'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

// Mock useDayjs
dayjs.locale('es')
vi.stubGlobal('useDayjs', () => dayjs)

import { generateWeeklySummaryText } from '~/utils/payrollShareFormatter'
import type { PayrollWeek, DaySchedule, WeekSchedule } from '~/types/payroll'

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

// ── Tests ─────────────────────────────────────────────────────────────────

describe('generateWeeklySummaryText', () => {
  it('genera texto con encabezado correcto', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Resumen Semanal - María')
    expect(text).toContain('09/02/2026')
    expect(text).toContain('15/02/2026') // end date (start + 6 days)
  })

  it('incluye días trabajados con horas y pago', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 },
        tuesday: { isWorking: true, hoursWorked: 7.5, regularHours: 7.5, dailyPay: 3375 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Lunes')
    expect(text).toContain('8.0h')
    expect(text).toContain('$3600.00')
    expect(text).toContain('Martes')
    expect(text).toContain('7.5h')
    expect(text).toContain('$3375.00')
  })

  it('omite días no trabajados', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Lunes')
    expect(text).not.toContain('Martes')
    expect(text).not.toContain('Domingo')
  })

  it('incluye totales de horas y pago base', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 },
        tuesday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Horas: 16.0h')
    expect(text).toContain('Pago base: $7200.00')
    expect(text).toContain('Total: $7200.00')
  })

  it('incluye propinas cuando > 0', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 500,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Propinas: $500.00')
    expect(text).toContain('Total: $4100.00')
  })

  it('omite línea de propinas cuando es 0', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).not.toContain('Propinas')
  })

  it('incluye horas extra cuando > 0', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 10, regularHours: 8, overtimeHours: 2, dailyPay: 4950 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('Horas extra: 2.0h')
  })

  it('usa moneda EUR cuando se especifica', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 100 }
      })
    }

    const text = generateWeeklySummaryText(week, 'Test', 'EUR')

    expect(text).toContain('€100.00')
  })

  it('incluye separador visual', () => {
    const week: PayrollWeek = {
      id: 'W1',
      startDate: '2026-02-09',
      weeklyTips: 0,
      schedule: makeSchedule({
        monday: { isWorking: true, hoursWorked: 8, regularHours: 8, dailyPay: 3600 }
      })
    }

    const text = generateWeeklySummaryText(week, 'María')

    expect(text).toContain('━━━━━━')
  })
})
