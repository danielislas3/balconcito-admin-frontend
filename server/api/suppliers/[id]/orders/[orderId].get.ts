import { eq, and } from 'drizzle-orm'
import { supplierOrders, supplierOrderItems } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  const orderId = Number(getRouterParam(event, 'orderId'))
  if (isNaN(supplierId) || isNaN(orderId)) throw badRequest('ID inválido')

  const db = useDB()

  const [order] = await db
    .select()
    .from(supplierOrders)
    .where(and(
      eq(supplierOrders.id, orderId),
      eq(supplierOrders.supplierId, supplierId)
    ))

  if (!order) throw notFound('Pedido no encontrado')

  const items = await db
    .select()
    .from(supplierOrderItems)
    .where(eq(supplierOrderItems.orderId, orderId))

  return {
    id: order.id,
    supplierId: order.supplierId,
    priceListId: order.priceListId,
    orderDate: order.orderDate,
    weekNumber: order.weekNumber,
    total: Number(order.total),
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: items.map(i => ({
      id: i.id,
      codigo: i.codigo,
      descripcion: i.descripcion,
      empaque: i.empaque,
      marca: i.marca,
      precio: Number(i.precio),
      cantidad: i.cantidad,
      subtotal: Number(i.subtotal)
    }))
  }
})
