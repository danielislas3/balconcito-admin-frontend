import { eq } from 'drizzle-orm'
import { suppliers } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw badRequest('ID inválido')

  const db = useDB()

  const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, id))
  if (!existing) throw notFound('Proveedor no encontrado')

  await db.delete(suppliers).where(eq(suppliers.id, id))

  setResponseStatus(event, 204)
  return null
})
