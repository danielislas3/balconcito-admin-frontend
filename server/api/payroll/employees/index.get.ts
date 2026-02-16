import { eq, asc } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const employees = await db
    .select()
    .from(payrollEmployees)
    .orderBy(asc(payrollEmployees.name))

  const result = []

  for (const emp of employees) {
    const weeks = await db
      .select()
      .from(payrollWeeks)
      .where(eq(payrollWeeks.payrollEmployeeId, Number(emp.id)))
      .orderBy(asc(payrollWeeks.startDate))

    const transformedWeeks = []
    for (const week of weeks) {
      const days = await db
        .select()
        .from(payrollDays)
        .where(eq(payrollDays.payrollWeekId, Number(week.id)))

      transformedWeeks.push(transformWeek(week, days))
    }

    result.push(transformEmployee(emp, transformedWeeks))
  }

  return { employees: result }
})
