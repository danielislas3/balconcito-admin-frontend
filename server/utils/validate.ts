import type { H3Event } from 'h3'
import type { z } from 'zod'

export async function validateBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw createApiError(422, 'Datos inválidos', { errors })
  }

  return result.data
}

export async function validateQuery<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const query = getQuery(event)
  const result = schema.safeParse(query)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw createApiError(422, 'Parámetros inválidos', { errors })
  }

  return result.data
}
