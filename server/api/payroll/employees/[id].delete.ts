import { eq } from 'drizzle-orm'
import { payrollEmployees } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const db = useDB()

  const result = await db.delete(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .returning({ id: payrollEmployees.id })

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Empleado no encontrado' })
  }

  return { ok: true }
})
