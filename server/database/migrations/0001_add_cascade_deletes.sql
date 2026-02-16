-- Add ON DELETE CASCADE to payroll foreign keys
-- This allows deleting an employee without manually deleting weeks/days first

ALTER TABLE payroll_days DROP CONSTRAINT fk_rails_0b38773218;
ALTER TABLE payroll_days ADD CONSTRAINT fk_payroll_days_week
  FOREIGN KEY (payroll_week_id) REFERENCES payroll_weeks(id) ON DELETE CASCADE;

ALTER TABLE payroll_weeks DROP CONSTRAINT fk_rails_24ac287813;
ALTER TABLE payroll_weeks ADD CONSTRAINT fk_payroll_weeks_employee
  FOREIGN KEY (payroll_employee_id) REFERENCES payroll_employees(id) ON DELETE CASCADE;
