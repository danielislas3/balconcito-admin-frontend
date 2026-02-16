import { describe, it, expect } from 'vitest'
import {
  getEmployeeSettings,
  transformWeek,
  transformEmployee
} from '~~/server/utils/payrollTransformers'

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeDbEmployee(overrides = {}) {
  return {
    id: BigInt(1),
    name: 'María',
    employeeId: 'EMP-001',
    baseHourlyRate: '450',
    currency: 'MXN',
    usesOvertime: true,
    usesTips: true,
    overtimeTier1Rate: '1.5',
    overtimeTier2Rate: '2.0',
    overtimeTier1Hours: 2,
    hoursPerShift: 8,
    breakHours: 1,
    minHoursForBreak: 5,
    ...overrides
  }
}

function makeDbWeek(overrides = {}) {
  return {
    id: BigInt(10),
    weekId: '2026-W07',
    startDate: '2026-02-09',
    weeklyTips: '200',
    shiftRate: null as string | null,
    ...overrides
  }
}

function makeDbDay(overrides = {}) {
  return {
    dayKey: 'monday',
    entryHour: '09',
    entryMinute: '00',
    exitHour: '18',
    exitMinute: '00',
    hoursWorked: '8',
    regularHours: '8',
    overtimeHours: '0',
    extraHours: '0',
    dailyPay: '3600',
    isWorking: true,
    forceOvertime: false,
    breakHours: null as string | null,
    ...overrides
  }
}

// ── getEmployeeSettings ───────────────────────────────────────────────────

describe('getEmployeeSettings', () => {
  it('parsea correctamente valores numéricos de strings', () => {
    const settings = getEmployeeSettings(makeDbEmployee())

    expect(settings.baseHourlyRate).toBe(450)
    expect(settings.overtimeTier1Rate).toBe(1.5)
    expect(settings.overtimeTier2Rate).toBe(2.0)
    expect(settings.overtimeTier1Hours).toBe(2)
    expect(settings.hoursPerShift).toBe(8)
    expect(settings.breakHours).toBe(1)
    expect(settings.minHoursForBreak).toBe(5)
  })

  it('usa defaults cuando campos son null', () => {
    const settings = getEmployeeSettings(makeDbEmployee({
      overtimeTier1Rate: null,
      overtimeTier2Rate: null,
      overtimeTier1Hours: null,
      hoursPerShift: null,
      breakHours: null,
      minHoursForBreak: null
    }))

    expect(settings.overtimeTier1Rate).toBe(1.5)
    expect(settings.overtimeTier2Rate).toBe(2.0)
    expect(settings.overtimeTier1Hours).toBe(2)
    expect(settings.hoursPerShift).toBe(8)
    expect(settings.breakHours).toBe(1)
    expect(settings.minHoursForBreak).toBe(5)
  })

  it('maneja baseHourlyRate "0" como 0', () => {
    const settings = getEmployeeSettings(makeDbEmployee({ baseHourlyRate: '0' }))
    expect(settings.baseHourlyRate).toBe(0)
  })

  it('preserva usesOvertime boolean', () => {
    expect(getEmployeeSettings(makeDbEmployee({ usesOvertime: true })).usesOvertime).toBe(true)
    expect(getEmployeeSettings(makeDbEmployee({ usesOvertime: false })).usesOvertime).toBe(false)
  })
})

// ── transformWeek ─────────────────────────────────────────────────────────

describe('transformWeek', () => {
  it('transforma semana con días completos', () => {
    const days = [
      makeDbDay({ dayKey: 'monday' }),
      makeDbDay({ dayKey: 'tuesday', hoursWorked: '7.5', dailyPay: '3375' })
    ]

    const result = transformWeek(makeDbWeek(), days)

    expect(result.id).toBe('2026-W07')
    expect(result.startDate).toBe('2026-02-09')
    expect(result.weeklyTips).toBe(200)
    expect(result.schedule.monday.hoursWorked).toBe(8)
    expect(result.schedule.monday.dailyPay).toBe(3600)
    expect(result.schedule.tuesday.hoursWorked).toBe(7.5)
    expect(result.schedule.tuesday.dailyPay).toBe(3375)
  })

  it('genera defaults para días sin datos', () => {
    const result = transformWeek(makeDbWeek(), [])

    expect(result.schedule.monday.hoursWorked).toBe(0)
    expect(result.schedule.monday.entryHour).toBe('')
    expect(result.schedule.monday.exitHour).toBe('')
    expect(result.schedule.monday.isWorking).toBe(false)
    expect(result.schedule.monday.forceOvertime).toBe(false)
    expect(result.schedule.sunday.hoursWorked).toBe(0)
  })

  it('todos los 7 días están presentes en schedule', () => {
    const result = transformWeek(makeDbWeek(), [])
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    for (const key of dayKeys) {
      expect(result.schedule).toHaveProperty(key)
    }
  })

  it('parsea shiftRate null como undefined', () => {
    const result = transformWeek(makeDbWeek({ shiftRate: null }), [])
    expect(result.shiftRate).toBeUndefined()
  })

  it('parsea shiftRate numérico correctamente', () => {
    const result = transformWeek(makeDbWeek({ shiftRate: '500' }), [])
    expect(result.shiftRate).toBe(500)
  })

  it('parsea weeklyTips null como 0', () => {
    const result = transformWeek(makeDbWeek({ weeklyTips: null }), [])
    expect(result.weeklyTips).toBe(0)
  })

  it('parsea breakHours null como undefined', () => {
    const result = transformWeek(makeDbWeek(), [makeDbDay({ breakHours: null })])
    expect(result.schedule.monday.breakHours).toBeUndefined()
  })

  it('parsea breakHours con valor como number', () => {
    const result = transformWeek(makeDbWeek(), [makeDbDay({ breakHours: '0.5' })])
    expect(result.schedule.monday.breakHours).toBe(0.5)
  })
})

// ── transformEmployee ─────────────────────────────────────────────────────

describe('transformEmployee', () => {
  it('transforma empleado con weeks', () => {
    const weeks = [transformWeek(makeDbWeek(), [])]
    const result = transformEmployee(makeDbEmployee(), weeks)

    expect(result.id).toBe('EMP-001')
    expect(result.name).toBe('María')
    expect(result.weeks).toHaveLength(1)
    expect(result.settings.baseHourlyRate).toBe(450)
    expect(result.settings.currency).toBe('MXN')
    expect(result.settings.usesTips).toBe(true)
  })

  it('transforma empleado sin weeks', () => {
    const result = transformEmployee(makeDbEmployee())

    expect(result.weeks).toEqual([])
  })

  it('settings usa getEmployeeSettings internamente', () => {
    const result = transformEmployee(makeDbEmployee({
      baseHourlyRate: '100',
      overtimeTier1Rate: null
    }))

    expect(result.settings.baseHourlyRate).toBe(100)
    expect(result.settings.overtimeTier1Rate).toBe(1.5) // default
  })

  it('currency default es MXN', () => {
    const result = transformEmployee(makeDbEmployee({ currency: '' }))
    expect(result.settings.currency).toBe('MXN')
  })
})
