import { eq, inArray } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

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

  const empId = Number(employees[0].id)

  // Borrar en cascada: days → weeks → employee
  const weeks = await db
    .select({ id: payrollWeeks.id })
    .from(payrollWeeks)
    .where(eq(payrollWeeks.payrollEmployeeId, empId))

  if (weeks.length > 0) {
    const weekIds = weeks.map(w => Number(w.id))
    await db.delete(payrollDays)
      .where(inArray(payrollDays.payrollWeekId, weekIds))
    await db.delete(payrollWeeks)
      .where(eq(payrollWeeks.payrollEmployeeId, empId))
  }

  await db.delete(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))

  return { ok: true }
})
