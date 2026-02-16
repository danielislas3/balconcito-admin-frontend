import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.object({
    baseHourlyRate: z.number().min(0).optional(),
    currency: z.string().optional(),
    usesOvertime: z.boolean().optional(),
    usesTips: z.boolean().optional(),
    overtimeTier1Rate: z.number().optional(),
    overtimeTier2Rate: z.number().optional(),
    overtimeTier1Hours: z.number().int().optional(),
    hoursPerShift: z.number().int().optional(),
    breakHours: z.number().int().optional(),
    minHoursForBreak: z.number().int().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const body = await validateBody(event, updateSchema)
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

  const updates: Record<string, any> = { updatedAt: now }

  if (body.name) updates.name = body.name

  if (body.settings) {
    const s = body.settings
    if (s.baseHourlyRate !== undefined) updates.baseHourlyRate = String(s.baseHourlyRate)
    if (s.currency !== undefined) updates.currency = s.currency
    if (s.usesOvertime !== undefined) updates.usesOvertime = s.usesOvertime
    if (s.usesTips !== undefined) updates.usesTips = s.usesTips
    if (s.overtimeTier1Rate !== undefined) updates.overtimeTier1Rate = String(s.overtimeTier1Rate)
    if (s.overtimeTier2Rate !== undefined) updates.overtimeTier2Rate = String(s.overtimeTier2Rate)
    if (s.overtimeTier1Hours !== undefined) updates.overtimeTier1Hours = s.overtimeTier1Hours
    if (s.hoursPerShift !== undefined) updates.hoursPerShift = s.hoursPerShift
    if (s.breakHours !== undefined) updates.breakHours = s.breakHours
    if (s.minHoursForBreak !== undefined) updates.minHoursForBreak = s.minHoursForBreak
  }

  await db.update(payrollEmployees)
    .set(updates)
    .where(eq(payrollEmployees.employeeId, employeeId))

  // Return full employee with weeks
  const updatedRows = await db
    .select()
    .from(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .limit(1)

  const updated = updatedRows[0]!

  const weeks = await db
    .select()
    .from(payrollWeeks)
    .where(eq(payrollWeeks.payrollEmployeeId, Number(updated.id)))
    .orderBy(asc(payrollWeeks.startDate))

  const transformedWeeks = []
  for (const week of weeks) {
    const days = await db
      .select()
      .from(payrollDays)
      .where(eq(payrollDays.payrollWeekId, Number(week.id)))
    transformedWeeks.push(transformWeek(week, days))
  }

  return { employee: transformEmployee(updated, transformedWeeks) }
})
