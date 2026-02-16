import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

const createWeekSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  weekly_tips: z.number().min(0).optional()
})

function getWeekId(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const year = date.getFullYear()

  // ISO week number calculation
  const jan1 = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date.getTime() - jan1.getTime()) / 86400000) + 1
  const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7)

  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const body = await validateBody(event, createWeekSchema)
  const db = useDB()
  const now = new Date().toISOString()

  const employees = await db
    .select()
    .from(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .limit(1)

  const emp = employees[0]
  if (!emp) {
    throw createError({ statusCode: 404, message: 'Empleado no encontrado' })
  }

  const weekId = getWeekId(body.start_date)
  const endDate = addDays(body.start_date, 6)

  // Check if week already exists
  const existing = await db
    .select({ id: payrollWeeks.id })
    .from(payrollWeeks)
    .where(eq(payrollWeeks.payrollEmployeeId, Number(emp.id)))

  const duplicate = existing.length > 0
    ? (await db.select({ id: payrollWeeks.id }).from(payrollWeeks)
        .where(eq(payrollWeeks.weekId, weekId)))
        .find(() => true)
    : undefined

  if (duplicate) {
    throw createError({ statusCode: 422, message: `La semana ${weekId} ya existe para este empleado` })
  }

  const weekRows = await db.insert(payrollWeeks).values({
    payrollEmployeeId: Number(emp.id),
    weekId,
    startDate: body.start_date,
    endDate,
    weeklyTips: String(body.weekly_tips ?? 0),
    createdAt: now,
    updatedAt: now
  }).returning()

  const week = weekRows[0]!

  // Create 7 empty days
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayValues = dayKeys.map((key, i) => ({
    payrollWeekId: Number(week.id),
    dayKey: key,
    date: addDays(body.start_date, i),
    createdAt: now,
    updatedAt: now
  }))

  await db.insert(payrollDays).values(dayValues)

  const days = await db
    .select()
    .from(payrollDays)
    .where(eq(payrollDays.payrollWeekId, Number(week.id)))

  return { week: transformWeek(week, days) }
})
