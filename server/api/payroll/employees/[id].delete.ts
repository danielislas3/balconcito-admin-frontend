import { eq } from 'drizzle-orm'
import { payrollEmployees } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const db = useDB()

  const employees = await db
    .select({ id: payrollEmployees.id })
    .from(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .limit(1)

  if (employees.length === 0) {
    throw createError({ statusCode: 404, message: 'Empleado no encontrado' })
  }

  await db.delete(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))

  return { ok: true }
})
