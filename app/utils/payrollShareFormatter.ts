import type { PayrollWeek, WeekSchedule } from '~/types/payroll'
import { WEEK_DAYS, type Currency } from './payrollConstants'
import { formatCurrency } from './payrollFormatters'
import { calculateWeekTotals } from './payrollCalculations'

export function generateWeeklySummaryText(
  week: PayrollWeek,
  employeeName: string,
  currency: Currency = 'MXN'
): string {
  const dayjs = useDayjs()
  const totals = calculateWeekTotals(week)
  const startDate = dayjs(week.startDate).format('DD/MM/YYYY')
  const endDate = dayjs(week.startDate).add(6, 'day').format('DD/MM/YYYY')

  const lines: string[] = []

  lines.push(`📋 *Resumen Semanal - ${employeeName}*`)
  lines.push(`📅 ${startDate} al ${endDate}`)
  lines.push('')

  const maxNameLen = Math.max(...WEEK_DAYS.map(d => d.name.length))

  for (const day of WEEK_DAYS) {
    const schedule = week.schedule[day.key as keyof WeekSchedule]
    if (!schedule || schedule.hoursWorked <= 0) continue

    const name = day.name.padEnd(maxNameLen)
    const hours = `${schedule.hoursWorked.toFixed(1)}h`
    const pay = formatCurrency(schedule.dailyPay, currency)

    lines.push(`${day.emoji} ${name} │ ${hours} │ ${pay}`)
  }

  lines.push('')
  lines.push(`⏰ Horas: ${totals.totalHours.toFixed(1)}h`)

  if (totals.totalOvertimeHours > 0) {
    lines.push(`⚡ Horas extra: ${totals.totalOvertimeHours.toFixed(1)}h`)
  }

  lines.push(`💰 Pago base: ${formatCurrency(totals.totalBasePay, currency)}`)

  if (week.weeklyTips > 0) {
    lines.push(`🪙 Propinas: ${formatCurrency(week.weeklyTips, currency)}`)
  }

  lines.push('━━━━━━━━━━━━━━━━━━')
  lines.push(`✅ *Total: ${formatCurrency(totals.totalPay, currency)}*`)

  return lines.join('\n')
}
