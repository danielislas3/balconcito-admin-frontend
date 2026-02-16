import { eq, asc } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
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

  const weeks = await db
    .select()
    .from(payrollWeeks)
    .where(eq(payrollWeeks.payrollEmployeeId, Number(emp.id)))
    .orderBy(asc(payrollWeeks.startDate))

  const result = []
  for (const week of weeks) {
    const days = await db
      .select()
      .from(payrollDays)
      .where(eq(payrollDays.payrollWeekId, Number(week.id)))
    result.push(transformWeek(week, days))
  }

  return { weeks: result }
})
