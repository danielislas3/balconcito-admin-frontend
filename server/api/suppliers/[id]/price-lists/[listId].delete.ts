import { eq, and } from 'drizzle-orm'
import { supplierPriceLists } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  const listId = Number(getRouterParam(event, 'listId'))
  if (isNaN(supplierId) || isNaN(listId)) throw badRequest('ID inválido')

  const db = useDB()

  const [existing] = await db
    .select()
    .from(supplierPriceLists)
    .where(and(
      eq(supplierPriceLists.id, listId),
      eq(supplierPriceLists.supplierId, supplierId)
    ))

  if (!existing) throw notFound('Lista de precios no encontrada')

  // Cascade delete removes associated products
  await db.delete(supplierPriceLists).where(eq(supplierPriceLists.id, listId))

  setResponseStatus(event, 204)
  return null
})
