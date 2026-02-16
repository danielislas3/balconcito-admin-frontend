import { z } from 'zod'
import { suppliers } from '~~/server/database/schema'

const createSupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug debe ser lowercase alfanumérico con guiones'),
  config: z.object({
    customerNumber: z.string().optional(),
    businessName: z.string().optional(),
    orderPerson: z.string().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createSupplierSchema)
  const db = useDB()
  const now = new Date().toISOString()

  const rows = await db.insert(suppliers).values({
    name: body.name,
    slug: body.slug,
    config: body.config || null,
    createdAt: now,
    updatedAt: now
  }).returning()

  const created = rows[0]!

  setResponseStatus(event, 201)
  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    config: created.config,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  }
})
