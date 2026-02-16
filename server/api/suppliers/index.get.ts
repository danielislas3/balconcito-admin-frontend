import { suppliers } from '~~/server/database/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const rows = await db.select().from(suppliers).orderBy(suppliers.name)

  return rows.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    config: s.config,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }))
})
