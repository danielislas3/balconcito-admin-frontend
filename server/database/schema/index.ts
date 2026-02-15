import { pgTable, index, foreignKey, bigserial, varchar, timestamp, integer, boolean, numeric, date, uniqueIndex, bigint } from 'drizzle-orm/pg-core'

// ============================================================================
// AUTH TABLES (Fase 3)
// ============================================================================

export const users = pgTable('users', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  createdAt: timestamp('created_at', { precision: 6, mode: 'string' }).notNull(),
  email: varchar().default('').notNull(),
  encryptedPassword: varchar('encrypted_password').default('').notNull(),
  name: varchar().notNull(),
  rememberCreatedAt: timestamp('remember_created_at', { precision: 6, mode: 'string' }),
  resetPasswordSentAt: timestamp('reset_password_sent_at', { precision: 6, mode: 'string' }),
  resetPasswordToken: varchar('reset_password_token'),
  role: varchar().default('admin'),
  updatedAt: timestamp('updated_at', { precision: 6, mode: 'string' }).notNull()
}, table => [
  uniqueIndex('index_users_on_email').using('btree', table.email.asc().nullsLast().op('text_ops')),
  uniqueIndex('index_users_on_reset_password_token').using('btree', table.resetPasswordToken.asc().nullsLast().op('text_ops'))
])

export const jwtDenylists = pgTable('jwt_denylists', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  createdAt: timestamp('created_at', { precision: 6, mode: 'string' }).notNull(),
  exp: timestamp({ precision: 6, mode: 'string' }),
  jti: varchar().notNull(),
  updatedAt: timestamp('updated_at', { precision: 6, mode: 'string' }).notNull()
}, table => [
  uniqueIndex('index_jwt_denylists_on_jti').using('btree', table.jti.asc().nullsLast().op('text_ops'))
])

// ============================================================================
// PAYROLL TABLES (Fase 4)
// ============================================================================

export const payrollEmployees = pgTable('payroll_employees', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  name: varchar().notNull(),
  employeeId: varchar('employee_id').notNull(),
  userId: bigint('user_id', { mode: 'number' }),
  baseHourlyRate: numeric('base_hourly_rate', { precision: 10, scale: 2 }).default('0.0').notNull(),
  currency: varchar().default('MXN').notNull(),
  usesOvertime: boolean('uses_overtime').default(true).notNull(),
  usesTips: boolean('uses_tips').default(false).notNull(),
  overtimeTier1Rate: numeric('overtime_tier1_rate', { precision: 5, scale: 2 }).default('1.5'),
  overtimeTier2Rate: numeric('overtime_tier2_rate', { precision: 5, scale: 2 }).default('2.0'),
  overtimeTier1Hours: integer('overtime_tier1_hours').default(2),
  hoursPerShift: integer('hours_per_shift').default(8),
  breakHours: integer('break_hours').default(1),
  minHoursForBreak: integer('min_hours_for_break').default(5),
  createdAt: timestamp('created_at', { precision: 6, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { precision: 6, mode: 'string' }).notNull()
}, table => [
  uniqueIndex('index_payroll_employees_on_employee_id').using('btree', table.employeeId.asc().nullsLast().op('text_ops')),
  index('index_payroll_employees_on_name').using('btree', table.name.asc().nullsLast().op('text_ops')),
  index('index_payroll_employees_on_user_id').using('btree', table.userId.asc().nullsLast().op('int8_ops')),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'fk_rails_d7c1f49d55'
  })
])

export const payrollWeeks = pgTable('payroll_weeks', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  payrollEmployeeId: bigint('payroll_employee_id', { mode: 'number' }).notNull(),
  weekId: varchar('week_id').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  weeklyTips: numeric('weekly_tips', { precision: 10, scale: 2 }).default('0.0'),
  totalHours: numeric('total_hours', { precision: 10, scale: 2 }).default('0.0'),
  totalRegularHours: numeric('total_regular_hours', { precision: 10, scale: 2 }).default('0.0'),
  totalOvertimeHours: numeric('total_overtime_hours', { precision: 10, scale: 2 }).default('0.0'),
  totalExtraHours: numeric('total_extra_hours', { precision: 10, scale: 2 }).default('0.0'),
  totalBasePay: numeric('total_base_pay', { precision: 10, scale: 2 }).default('0.0'),
  totalPay: numeric('total_pay', { precision: 10, scale: 2 }).default('0.0'),
  totalShifts: integer('total_shifts').default(0),
  createdAt: timestamp('created_at', { precision: 6, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { precision: 6, mode: 'string' }).notNull(),
  shiftRate: numeric('shift_rate')
}, table => [
  index('index_payroll_weeks_on_payroll_employee_id').using('btree', table.payrollEmployeeId.asc().nullsLast().op('int8_ops')),
  uniqueIndex('index_payroll_weeks_on_payroll_employee_id_and_week_id').using('btree', table.payrollEmployeeId.asc().nullsLast().op('int8_ops'), table.weekId.asc().nullsLast().op('int8_ops')),
  index('index_payroll_weeks_on_start_date').using('btree', table.startDate.asc().nullsLast().op('date_ops')),
  index('index_payroll_weeks_on_week_id').using('btree', table.weekId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.payrollEmployeeId],
    foreignColumns: [payrollEmployees.id],
    name: 'fk_rails_24ac287813'
  })
])

export const payrollDays = pgTable('payroll_days', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  payrollWeekId: bigint('payroll_week_id', { mode: 'number' }).notNull(),
  dayKey: varchar('day_key').notNull(),
  date: date().notNull(),
  entryHour: varchar('entry_hour'),
  entryMinute: varchar('entry_minute'),
  exitHour: varchar('exit_hour'),
  exitMinute: varchar('exit_minute'),
  hoursWorked: numeric('hours_worked', { precision: 5, scale: 2 }).default('0.0'),
  regularHours: numeric('regular_hours', { precision: 5, scale: 2 }).default('0.0'),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0.0'),
  extraHours: numeric('extra_hours', { precision: 5, scale: 2 }).default('0.0'),
  dailyPay: numeric('daily_pay', { precision: 10, scale: 2 }).default('0.0'),
  isWorking: boolean('is_working').default(false),
  createdAt: timestamp('created_at', { precision: 6, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { precision: 6, mode: 'string' }).notNull(),
  forceOvertime: boolean('force_overtime').default(false).notNull(),
  breakHours: numeric('break_hours', { precision: 5, scale: 2 })
}, table => [
  index('index_payroll_days_on_date').using('btree', table.date.asc().nullsLast().op('date_ops')),
  index('index_payroll_days_on_payroll_week_id').using('btree', table.payrollWeekId.asc().nullsLast().op('int8_ops')),
  uniqueIndex('index_payroll_days_on_payroll_week_id_and_day_key').using('btree', table.payrollWeekId.asc().nullsLast().op('text_ops'), table.dayKey.asc().nullsLast().op('int8_ops')),
  foreignKey({
    columns: [table.payrollWeekId],
    foreignColumns: [payrollWeeks.id],
    name: 'fk_rails_0b38773218'
  })
])
