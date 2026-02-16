import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { suppliers } from '~~/server/database/schema'

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.object({
    customerNumber: z.string().optional(),
    businessName: z.string().optional(),
    orderPerson: z.string().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw badRequest('ID inválido')

  const body = await validateBody(event, updateSupplierSchema)
  const db = useDB()

  const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, id))
  if (!existing) throw notFound('Proveedor no encontrado')

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.config !== undefined) updateData.config = body.config

  const rows = await db.update(suppliers).set(updateData).where(eq(suppliers.id, id)).returning()
  const updated = rows[0]!

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    config: updated.config,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  }
})
