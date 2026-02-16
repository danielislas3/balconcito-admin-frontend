import { describe, it, expect, vi } from 'vitest'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

// Mock useDayjs composable antes de importar los módulos
dayjs.locale('es')
vi.stubGlobal('useDayjs', () => dayjs)

import { formatWeekDisplay, formatMonthDisplay } from '~/utils/payrollFormatters'

describe('formatWeekDisplay', () => {
  it('formatea fecha en DD/MM/YYYY', () => {
    expect(formatWeekDisplay('2026-02-09')).toBe('09/02/2026')
  })

  it('formatea otra fecha correctamente', () => {
    expect(formatWeekDisplay('2025-12-25')).toBe('25/12/2025')
  })

  it('maneja primer día del año', () => {
    expect(formatWeekDisplay('2026-01-01')).toBe('01/01/2026')
  })
})

describe('formatMonthDisplay', () => {
  it('formatea mes completo en español', () => {
    const result = formatMonthDisplay('2026-02-09')
    expect(result).toBe('febrero 2026')
  })

  it('formatea diciembre correctamente', () => {
    const result = formatMonthDisplay('2025-12-25')
    expect(result).toBe('diciembre 2025')
  })

  it('formatea enero correctamente', () => {
    const result = formatMonthDisplay('2026-01-15')
    expect(result).toBe('enero 2026')
  })
})
