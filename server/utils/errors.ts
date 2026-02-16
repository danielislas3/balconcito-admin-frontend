import { createError } from 'h3'

export function createApiError(statusCode: number, message: string, data?: Record<string, unknown>) {
  return createError({
    statusCode,
    statusMessage: message,
    data: {
      error_message: message,
      ...data
    }
  })
}

export function notFound(message = 'Recurso no encontrado') {
  return createApiError(404, message)
}

export function badRequest(message = 'Solicitud inválida') {
  return createApiError(400, message)
}

export function unprocessable(message = 'Datos inválidos', errors?: Record<string, string[]>) {
  return createApiError(422, message, errors ? { errors } : undefined)
}
