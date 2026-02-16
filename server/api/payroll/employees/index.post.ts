import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { payrollEmployees } from '~~/server/database/schema'

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  base_hourly_rate: z.number().min(0),
  currency: z.string().default('MXN')
})

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createSchema)
  const db = useDB()
  const now = new Date().toISOString()

  // Generate next employee ID (EMP-001, EMP-002, ...)
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payrollEmployees)
  const nextNum = (countResult[0]?.count ?? 0) + 1
  const employeeId = `EMP-${String(nextNum).padStart(3, '0')}`

  const rows = await db.insert(payrollEmployees).values({
    name: body.name,
    employeeId,
    baseHourlyRate: String(body.base_hourly_rate),
    currency: body.currency,
    createdAt: now,
    updatedAt: now
  }).returning()

  const emp = rows[0]!
  return { employee: transformEmployee(emp, []) }
})
