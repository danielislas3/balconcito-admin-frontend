import { eq, desc } from 'drizzle-orm'
import { suppliers, supplierOrders } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  if (isNaN(supplierId)) throw badRequest('ID inválido')

  const db = useDB()

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId))
  if (!supplier) throw notFound('Proveedor no encontrado')

  const orders = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.supplierId, supplierId))
    .orderBy(desc(supplierOrders.createdAt))

  return orders.map(o => ({
    id: o.id,
    supplierId: o.supplierId,
    priceListId: o.priceListId,
    orderDate: o.orderDate,
    weekNumber: o.weekNumber,
    total: Number(o.total),
    notes: o.notes,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  }))
})
