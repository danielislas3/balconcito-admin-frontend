import { describe, it, expect } from 'vitest'
import { createApiError, notFound, badRequest, unprocessable } from '~~/server/utils/errors'

describe('createApiError', () => {
  it('crea error con statusCode y message', () => {
    const error = createApiError(404, 'No encontrado')

    expect(error.statusCode).toBe(404)
    expect(error.statusMessage).toBe('No encontrado')
  })

  it('incluye error_message en data', () => {
    const error = createApiError(400, 'Campo requerido')

    expect(error.data?.error_message).toBe('Campo requerido')
  })

  it('incluye data adicional', () => {
    const error = createApiError(422, 'Inválido', { field: 'name' })

    expect(error.data?.error_message).toBe('Inválido')
    expect(error.data?.field).toBe('name')
  })
})

describe('notFound', () => {
  it('crea error 404 con mensaje default', () => {
    const error = notFound()

    expect(error.statusCode).toBe(404)
    expect(error.statusMessage).toBe('Recurso no encontrado')
  })

  it('acepta mensaje personalizado', () => {
    const error = notFound('Empleado no encontrado')

    expect(error.statusCode).toBe(404)
    expect(error.statusMessage).toBe('Empleado no encontrado')
  })
})

describe('badRequest', () => {
  it('crea error 400 con mensaje default', () => {
    const error = badRequest()

    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Solicitud inválida')
  })

  it('acepta mensaje personalizado', () => {
    const error = badRequest('Falta el campo nombre')

    expect(error.statusMessage).toBe('Falta el campo nombre')
  })
})

describe('unprocessable', () => {
  it('crea error 422 con mensaje default', () => {
    const error = unprocessable()

    expect(error.statusCode).toBe(422)
    expect(error.statusMessage).toBe('Datos inválidos')
  })

  it('incluye errores de validación en data', () => {
    const errors = { name: ['es requerido'], email: ['formato inválido'] }
    const error = unprocessable('Validación fallida', errors)

    expect(error.statusCode).toBe(422)
    expect(error.data?.errors).toEqual(errors)
  })

  it('no incluye errors si no se proporcionan', () => {
    const error = unprocessable('Inválido')

    expect(error.data?.errors).toBeUndefined()
  })
})
