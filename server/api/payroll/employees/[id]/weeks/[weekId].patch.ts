import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { payrollEmployees, payrollWeeks, payrollDays } from '~~/server/database/schema'

const updateWeekSchema = z.object({
  weekly_tips: z.number().min(0).optional(),
  shift_rate: z.number().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const employeeId = getRouterParam(event, 'id')!
  const weekId = getRouterParam(event, 'weekId')!
  const body = await validateBody(event, updateWeekSchema)
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

  const updates: Record<string, any> = { updatedAt: now }

  if (body.weekly_tips !== undefined) {
    updates.weeklyTips = String(body.weekly_tips)
  }

  if (body.shift_rate !== undefined) {
    updates.shiftRate = body.shift_rate != null ? String(body.shift_rate) : null
  }

  // If shift_rate changed, recalculate all days
  const shiftRateChanged = body.shift_rate !== undefined
  const tipsChanged = body.weekly_tips !== undefined

  if (shiftRateChanged) {
    const settings = getEmployeeSettings(emp)
    const newShiftRate = body.shift_rate

    const days = await db
      .select()
      .from(payrollDays)
      .where(eq(payrollDays.payrollWeekId, Number(week.id)))

    for (const day of days) {
      if (!day.isWorking) continue

      const result = calculateDayHoursAndPay({
        entryHour: day.entryHour || '0',
        entryMinute: day.entryMinute || '0',
        exitHour: day.exitHour || '0',
        exitMinute: day.exitMinute || '0',
        isWorking: true,
        forceOvertime: day.forceOvertime,
        breakHours: day.breakHours != null ? parseFloat(day.breakHours) : null
      }, settings, newShiftRate)

      await db.update(payrollDays)
        .set({
          dailyPay: String(result.dailyPay),
          updatedAt: now
        })
        .where(eq(payrollDays.id, day.id))
    }
  }

  await db.update(payrollWeeks)
    .set(updates)
    .where(eq(payrollWeeks.id, week.id))

  // Recalculate week aggregates if needed
  if (shiftRateChanged || tipsChanged) {
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

    const newTips = body.weekly_tips !== undefined ? body.weekly_tips : parseFloat(week.weeklyTips || '0')
    const agg = calculateWeekAggregates(dayResults, newTips)

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
  }

  // Return updated week
  const updatedWeeks = await db
    .select()
    .from(payrollWeeks)
    .where(eq(payrollWeeks.id, week.id))
    .limit(1)

  const updatedDays = await db
    .select()
    .from(payrollDays)
    .where(eq(payrollDays.payrollWeekId, Number(week.id)))

  return { week: transformWeek(updatedWeeks[0]!, updatedDays) }
})
