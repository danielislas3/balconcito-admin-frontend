import { eq, desc } from 'drizzle-orm'
import { suppliers, supplierPriceLists } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  if (isNaN(supplierId)) throw badRequest('ID inválido')

  const db = useDB()

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId))
  if (!supplier) throw notFound('Proveedor no encontrado')

  const lists = await db
    .select()
    .from(supplierPriceLists)
    .where(eq(supplierPriceLists.supplierId, supplierId))
    .orderBy(desc(supplierPriceLists.year), desc(supplierPriceLists.id))

  return lists.map(l => ({
    id: l.id,
    supplierId: l.supplierId,
    month: l.month,
    year: l.year,
    fileName: l.fileName,
    totalProducts: l.totalProducts,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt
  }))
})
