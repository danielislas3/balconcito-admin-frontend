import { eq, and } from 'drizzle-orm'
import { suppliers, supplierPriceLists, supplierProducts } from '~~/server/database/schema'
import { parseApysExcel } from '~~/server/utils/supplierExcelParser'

export default defineEventHandler(async (event) => {
  const supplierId = Number(getRouterParam(event, 'id'))
  if (isNaN(supplierId)) throw badRequest('ID inválido')

  const db = useDB()

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId))
  if (!supplier) throw notFound('Proveedor no encontrado')

  // Read multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw badRequest('No se recibió archivo')
  }

  const filePart = formData.find(part => part.name === 'file')
  if (!filePart || !filePart.data) {
    throw badRequest('No se encontró el archivo en el formulario')
  }

  const fileName = filePart.filename || 'unknown.xlsx'
  const buffer = Buffer.from(filePart.data)

  // Parse Excel based on supplier slug
  let parsed
  if (supplier.slug === 'apys') {
    parsed = parseApysExcel(buffer, fileName)
  } else {
    throw badRequest(`Parser no disponible para proveedor: ${supplier.slug}`)
  }

  if (parsed.products.length === 0) {
    throw badRequest('No se encontraron productos en el archivo')
  }

  const now = new Date().toISOString()

  // Check if a list for this month/year already exists → delete it (replace)
  const [existingList] = await db
    .select()
    .from(supplierPriceLists)
    .where(and(
      eq(supplierPriceLists.supplierId, supplierId),
      eq(supplierPriceLists.month, parsed.month),
      eq(supplierPriceLists.year, parsed.year)
    ))

  if (existingList) {
    // Cascade delete will remove associated products
    await db.delete(supplierPriceLists).where(eq(supplierPriceLists.id, existingList.id))
  }

  // Create new price list
  const rows = await db.insert(supplierPriceLists).values({
    supplierId,
    month: parsed.month,
    year: parsed.year,
    fileName,
    totalProducts: parsed.products.length,
    createdAt: now,
    updatedAt: now
  }).returning()

  const newList = rows[0]!

  // Batch insert products (chunks of 500 to avoid query size limits)
  const CHUNK_SIZE = 500
  for (let i = 0; i < parsed.products.length; i += CHUNK_SIZE) {
    const chunk = parsed.products.slice(i, i + CHUNK_SIZE)
    await db.insert(supplierProducts).values(
      chunk.map(p => ({
        priceListId: newList.id,
        codigo: p.codigo,
        descripcion: p.descripcion,
        empaque: p.empaque || null,
        marca: p.marca || null,
        precioPublico: String(p.precioPublico),
        precioMayoreo: String(p.precioMayoreo),
        category: p.category || null,
        searchText: p.searchText
      }))
    )
  }

  setResponseStatus(event, 201)

  return {
    id: newList.id,
    supplierId: newList.supplierId,
    month: newList.month,
    year: newList.year,
    fileName: newList.fileName,
    totalProducts: newList.totalProducts,
    replaced: !!existingList,
    createdAt: newList.createdAt,
    updatedAt: newList.updatedAt
  }
})
