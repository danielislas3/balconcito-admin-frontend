import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

const daySchema = z.object({
  entryHour: z.string().optional(),
  entryMinute: z.string().optional(),
  exitHour: z.string().optional(),
  exitMinute: z.string().optional(),
  isWorking: z.boolean().optional(),
  forceOvertime: z.boolean().optional(),
  breakHours: z.number().nullable().optional()
})

const scheduleSchema = z.object({
  schedule: z.record(z.string(), daySchema)
})

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const weekId = getRouterParam(event, 'weekId')!
  const body = await validateBody(event, scheduleSchema)
  const db = useDB()
  const now = new Date().toISOString()

  // Fetch employee
  const employees = await db
    .select()
    .from(payrollEmployees)
    .where(eq(payrollEmployees.employeeId, employeeId))
    .limit(1)

  const emp = employees[0]
  if (!emp) {
    throw createError({ statusCode: 404, message: 'Empleado no encontrado' })
  }

  const settings = getEmployeeSettings(emp)

  // Fetch week
  const weeks = await db
    .select()
    .from(payrollWeeks)
    .where(and(
      eq(payrollWeeks.payrollEmployeeId, Number(emp.id)),
      eq(payrollWeeks.weekId, weekId)
    ))
    .limit(1)

  const week = weeks[0]
  if (!week) {
    throw createError({ statusCode: 404, message: 'Semana no encontrada' })
  }

  const shiftRate = week.shiftRate ? parseFloat(week.shiftRate) : null

  // Update each day in the schedule
  for (const [dayKey, dayInput] of Object.entries(body.schedule)) {
    const existingDays = await db
      .select()
      .from(payrollDays)
      .where(and(
        eq(payrollDays.payrollWeekId, Number(week.id)),
        eq(payrollDays.dayKey, dayKey)
      ))
      .limit(1)

    const existing = existingDays[0]
    if (!existing) continue

    // Merge with existing values
    const merged: DayInput = {
      entryHour: dayInput.entryHour ?? existing.entryHour ?? '0',
      entryMinute: dayInput.entryMinute ?? existing.entryMinute ?? '0',
      exitHour: dayInput.exitHour ?? existing.exitHour ?? '0',
      exitMinute: dayInput.exitMinute ?? existing.exitMinute ?? '0',
      isWorking: dayInput.isWorking ?? existing.isWorking ?? false,
      forceOvertime: dayInput.forceOvertime ?? existing.forceOvertime,
      breakHours: dayInput.breakHours !== undefined
        ? dayInput.breakHours
        : (existing.breakHours != null ? parseFloat(existing.breakHours) : null)
    }

    const result = calculateDayHoursAndPay(merged, settings, shiftRate)

    await db.update(payrollDays)
      .set({
        entryHour: merged.entryHour,
        entryMinute: merged.entryMinute,
        exitHour: merged.exitHour,
        exitMinute: merged.exitMinute,
        isWorking: merged.isWorking,
        forceOvertime: merged.forceOvertime ?? false,
        breakHours: merged.breakHours != null ? String(merged.breakHours) : null,
        hoursWorked: String(result.hoursWorked),
        regularHours: String(result.regularHours),
        overtimeHours: String(result.overtimeHours),
        extraHours: String(result.extraHours),
        dailyPay: String(result.dailyPay),
        updatedAt: now
      })
      .where(eq(payrollDays.id, existing.id))
  }

  // Recalculate week aggregates
  const allDays = await db
    .select()
    .from(payrollDays)
    .where(eq(payrollDays.payrollWeekId, Number(week.id)))

  const dayResults = allDays.map(d => ({
    hoursWorked: parseFloat(d.hoursWorked || '0'),
    regularHours: parseFloat(d.regularHours || '0'),
    overtimeHours: parseFloat(d.overtimeHours || '0'),
    extraHours: parseFloat(d.extraHours || '0'),
    dailyPay: parseFloat(d.dailyPay || '0')
  }))

  const weeklyTips = parseFloat(week.weeklyTips || '0')
  const agg = calculateWeekAggregates(dayResults, weeklyTips)

  await db.update(payrollWeeks)
    .set({
      totalHours: String(agg.totalHours),
      totalRegularHours: String(agg.totalRegularHours),
      totalOvertimeHours: String(agg.totalOvertimeHours),
      totalExtraHours: String(agg.totalExtraHours),
      totalBasePay: String(agg.totalBasePay),
      totalPay: String(agg.totalPay),
      totalShifts: agg.totalShifts,
      updatedAt: now
    })
    .where(eq(payrollWeeks.id, week.id))

  // Return updated week
  const updatedWeeks = await db
    .select()
    .from(payrollWeeks)
    .where(eq(payrollWeeks.id, week.id))
    .limit(1)

  return { week: transformWeek(updatedWeeks[0]!, allDays) }
})
