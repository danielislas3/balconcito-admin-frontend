import { describe, it, expect } from 'vitest'
import { formatErrorMessage, isApiError } from '~/utils/errorHandler'

// ── formatErrorMessage ────────────────────────────────────────────────────

describe('formatErrorMessage', () => {
  it('devuelve el string directamente', () => {
    expect(formatErrorMessage('algo salió mal')).toBe('algo salió mal')
  })

  it('extrae message de Error object', () => {
    expect(formatErrorMessage(new Error('network error'))).toBe('network error')
  })

  it('extrae message de objeto con .message', () => {
    expect(formatErrorMessage({ message: 'custom error' })).toBe('custom error')
  })

  it('extrae error_message de _data (formato Nuxt/h3)', () => {
    const error = {
      _data: { error_message: 'empleado no encontrado' }
    }
    expect(formatErrorMessage(error)).toBe('empleado no encontrado')
  })

  it('devuelve mensaje por defecto para null', () => {
    expect(formatErrorMessage(null)).toBe('Ocurrió un error inesperado')
  })

  it('devuelve mensaje por defecto para undefined', () => {
    expect(formatErrorMessage(undefined)).toBe('Ocurrió un error inesperado')
  })

  it('devuelve mensaje por defecto para number', () => {
    expect(formatErrorMessage(42)).toBe('Ocurrió un error inesperado')
  })

  it('prioriza .message sobre ._data.error_message', () => {
    const error = {
      message: 'direct message',
      _data: { error_message: 'nested message' }
    }
    expect(formatErrorMessage(error)).toBe('direct message')
  })
})

// ── isApiError ────────────────────────────────────────────────────────────

describe('isApiError', () => {
  it('reconoce objeto con status y message', () => {
    expect(isApiError({ status: 404, message: 'not found' })).toBe(true)
  })

  it('reconoce objeto solo con status', () => {
    expect(isApiError({ status: 500 })).toBe(true)
  })

  it('reconoce objeto solo con message', () => {
    expect(isApiError({ message: 'error' })).toBe(true)
  })

  it('rechaza null', () => {
    expect(isApiError(null)).toBe(false)
  })

  it('rechaza undefined', () => {
    expect(isApiError(undefined)).toBe(false)
  })

  it('rechaza string', () => {
    expect(isApiError('error')).toBe(false)
  })

  it('rechaza number', () => {
    expect(isApiError(42)).toBe(false)
  })

  it('rechaza objeto vacío', () => {
    // Objeto vacío sin status ni message
    expect(isApiError({})).toBe(false)
  })
})
