import { eq, desc } from 'drizzle-orm'
import { suppliers, supplierPriceLists, supplierProducts } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  if (isNaN(supplierId)) throw badRequest('ID inválido')

  const db = useDB()

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId))
  if (!supplier) throw notFound('Proveedor no encontrado')

  // Get the two most recent price lists
  const lists = await db
    .select()
    .from(supplierPriceLists)
    .where(eq(supplierPriceLists.supplierId, supplierId))
    .orderBy(desc(supplierPriceLists.year), desc(supplierPriceLists.id))
    .limit(2)

  if (lists.length < 2) {
    return { comparisons: [], currentList: lists[0] || null, previousList: null }
  }

  const currentList = lists[0]!
  const previousList = lists[1]!

  // Fetch all products from both lists
  const currentProducts = await db
    .select()
    .from(supplierProducts)
    .where(eq(supplierProducts.priceListId, currentList.id))

  const previousProducts = await db
    .select()
    .from(supplierProducts)
    .where(eq(supplierProducts.priceListId, previousList.id))

  // Build lookup by codigo
  const previousMap = new Map(previousProducts.map(p => [p.codigo, p]))

  const comparisons = []

  for (const current of currentProducts) {
    const previous = previousMap.get(current.codigo)
    if (!previous) continue

    const currentPrice = Number(current.precioMayoreo)
    const previousPrice = Number(previous.precioMayoreo)
    const difference = currentPrice - previousPrice

    if (difference !== 0) {
      const percentageChange = (difference / previousPrice) * 100
      comparisons.push({
        codigo: current.codigo,
        descripcion: current.descripcion,
        currentPrice,
        previousPrice,
        difference,
        percentageChange
      })
    }
  }

  // Sort by absolute percentage change (largest first)
  comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))

  return {
    comparisons,
    currentList: { id: currentList.id, month: currentList.month, year: currentList.year },
    previousList: { id: previousList.id, month: previousList.month, year: previousList.year }
  }
})
