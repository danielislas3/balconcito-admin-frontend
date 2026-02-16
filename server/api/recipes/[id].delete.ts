import { eq } from 'drizzle-orm'
import { recipes } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw badRequest('ID inválido')

  const db = useDB()

  const [existing] = await db.select().from(recipes).where(eq(recipes.id, id))
  if (!existing) throw notFound('Receta no encontrada')

  // cascade delete handles ingredients and steps
  await db.delete(recipes).where(eq(recipes.id, id))

  setResponseStatus(event, 204)
  return null
})
