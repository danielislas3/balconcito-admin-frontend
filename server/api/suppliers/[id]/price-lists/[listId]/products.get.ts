import { eq, and, ilike, sql } from 'drizzle-orm'
import { supplierPriceLists, supplierProducts } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  const listId = Number(getRouterParam(event, 'listId'))
  if (isNaN(supplierId) || isNaN(listId)) throw badRequest('ID inválido')

  const query = getQuery(event)
  const search = (query.search as string || '').trim()
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = Number(query.offset) || 0

  const db = useDB()

  // Verify the list belongs to the supplier
  const [list] = await db
    .select()
    .from(supplierPriceLists)
    .where(and(
      eq(supplierPriceLists.id, listId),
      eq(supplierPriceLists.supplierId, supplierId)
    ))

  if (!list) throw notFound('Lista de precios no encontrada')

  // Build query conditions
  const conditions = [eq(supplierProducts.priceListId, listId)]

  if (search.length >= 2) {
    // Split search into terms for AND matching
    const terms = search.toLowerCase().split(/\s+/).filter(t => t.length >= 2)
    for (const term of terms) {
      conditions.push(ilike(supplierProducts.searchText, `%${term}%`))
    }
  }

  const products = await db
    .select()
    .from(supplierProducts)
    .where(and(...conditions))
    .orderBy(sql`CAST(${supplierProducts.precioPublico} AS NUMERIC) ASC`)
    .limit(limit)
    .offset(offset)

  return products.map(p => ({
    id: p.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    empaque: p.empaque,
    marca: p.marca,
    precioPublico: Number(p.precioPublico),
    precioMayoreo: Number(p.precioMayoreo),
    category: p.category
  }))
})
