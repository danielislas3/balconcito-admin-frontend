import { relations } from 'drizzle-orm/relations'
import { users, jwtDenylists, payrollEmployees, payrollWeeks, payrollDays } from './index'

export const usersRelations = relations(users, ({ many }) => ({
  payrollEmployees: many(payrollEmployees)
}))

export const payrollEmployeesRelations = relations(payrollEmployees, ({ one, many }) => ({
  user: one(users, {
    fields: [payrollEmployees.userId],
    references: [users.id]
  }),
  weeks: many(payrollWeeks)
}))

export const payrollWeeksRelations = relations(payrollWeeks, ({ one, many }) => ({
  employee: one(payrollEmployees, {
    fields: [payrollWeeks.payrollEmployeeId],
    references: [payrollEmployees.id]
  }),
  days: many(payrollDays)
}))

export const payrollDaysRelations = relations(payrollDays, ({ one }) => ({
  week: one(payrollWeeks, {
    fields: [payrollDays.payrollWeekId],
    references: [payrollWeeks.id]
  })
}))
