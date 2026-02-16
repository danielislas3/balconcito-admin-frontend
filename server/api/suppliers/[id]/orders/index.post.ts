import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { suppliers, supplierOrders, supplierOrderItems } from '~~/server/database/schema'

const orderItemSchema = z.object({
  codigo: z.string(),
  descripcion: z.string(),
  empaque: z.string().optional(),
  marca: z.string().optional(),
  precio: z.number(),
  cantidad: z.number().int().positive()
})

const createOrderSchema = z.object({
  priceListId: z.number().int().positive(),
  orderDate: z.string().min(1),
  weekNumber: z.number().int().optional(),
  total: z.number(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'El pedido debe tener al menos un item')
})

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  if (isNaN(supplierId)) throw badRequest('ID inválido')

  const body = await validateBody(event, createOrderSchema)
  const db = useDB()

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId))
  if (!supplier) throw notFound('Proveedor no encontrado')

  const now = new Date().toISOString()

  const rows = await db.insert(supplierOrders).values({
    supplierId,
    priceListId: body.priceListId,
    orderDate: body.orderDate,
    weekNumber: body.weekNumber || null,
    total: String(body.total),
    notes: body.notes || null,
    createdAt: now,
    updatedAt: now
  }).returning()

  const newOrder = rows[0]!

  await db.insert(supplierOrderItems).values(
    body.items.map(item => ({
      orderId: newOrder.id,
      codigo: item.codigo,
      descripcion: item.descripcion,
      empaque: item.empaque || null,
      marca: item.marca || null,
      precio: String(item.precio),
      cantidad: item.cantidad,
      subtotal: String(item.precio * item.cantidad)
    }))
  )

  setResponseStatus(event, 201)

  return {
    id: newOrder.id,
    supplierId: newOrder.supplierId,
    priceListId: newOrder.priceListId,
    orderDate: newOrder.orderDate,
    weekNumber: newOrder.weekNumber,
    total: Number(newOrder.total),
    notes: newOrder.notes,
    items: body.items,
    createdAt: newOrder.createdAt,
    updatedAt: newOrder.updatedAt
  }
})
