import { describe, it, expect } from 'vitest'
import { formatCurrency, formatTime, formatHours } from '~/utils/payrollFormatters'

// ── formatCurrency ────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formatea MXN con símbolo $', () => {
    expect(formatCurrency(1500, 'MXN')).toBe('$1500.00')
  })

  it('formatea USD con símbolo $', () => {
    expect(formatCurrency(25.5, 'USD')).toBe('$25.50')
  })

  it('formatea EUR con símbolo correspondiente', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00')
  })

  it('maneja cantidad 0', () => {
    expect(formatCurrency(0, 'MXN')).toBe('$0.00')
  })

  it('redondea a 2 decimales', () => {
    expect(formatCurrency(1500.999, 'MXN')).toBe('$1501.00')
  })

  it('usa MXN como default', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })
})

// ── formatTime ────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formatea hora y minuto correctamente', () => {
    expect(formatTime('09', '30')).toBe('09:30')
  })

  it('devuelve placeholder cuando hora está vacía', () => {
    expect(formatTime('', '30')).toBe('--:--')
  })

  it('devuelve placeholder cuando minuto está vacío', () => {
    expect(formatTime('09', '')).toBe('--:--')
  })

  it('devuelve placeholder cuando ambos están vacíos', () => {
    expect(formatTime('', '')).toBe('--:--')
  })

  it('maneja hora 00:00', () => {
    expect(formatTime('00', '00')).toBe('00:00')
  })

  it('maneja hora 23:59', () => {
    expect(formatTime('23', '59')).toBe('23:59')
  })
})

// ── formatHours ───────────────────────────────────────────────────────────

describe('formatHours', () => {
  it('formatea horas con un decimal', () => {
    expect(formatHours(8.5)).toBe('8.5h')
  })

  it('muestra .0 para horas enteras', () => {
    expect(formatHours(8)).toBe('8.0h')
  })

  it('maneja 0 horas', () => {
    expect(formatHours(0)).toBe('0.0h')
  })

  it('redondea a un decimal', () => {
    expect(formatHours(8.75)).toBe('8.8h')
  })
})
