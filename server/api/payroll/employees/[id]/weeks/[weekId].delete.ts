import { eq, and } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const weekId = getRouterParam(event, 'weekId')!
  const db = useDB()

  const employees = await db
    .select({ id: payrollEmployees.id })
    .from(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .limit(1)

  const emp = employees[0]
  if (!emp) {
    throw createError({ statusCode: 404, message: 'Empleado no encontrado' })
  }

  const deleted = await db.delete(payrollWeeks)
    .where(and(
      eq(payrollWeeks.payrollEmployeeId, Number(emp.id)),
      eq(payrollWeeks.weekId, weekId)
    ))
    .returning({ id: payrollWeeks.id })

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, message: 'Semana no encontrada' })
  }

  return { ok: true }
})
