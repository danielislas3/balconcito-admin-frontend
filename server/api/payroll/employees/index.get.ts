import { asc } from 'drizzle-orm'
import { payrollEmployees } from '~~/server/database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const employees = await db
    .select()
    .from(payrollEmployees)
    .orderBy(asc(payrollEmployees.name))

  return {
    employees: employees.map(emp => transformEmployee(emp))
  }
})
