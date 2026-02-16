import type { PayrollEmployee, PayrollWeek } from '~/types/payroll'

export interface EmployeeListItem {
  id: string
  name: string
}

export const usePayrollApi = () => {
  const fetchEmployees = async (): Promise<EmployeeListItem[]> => {
    const response = await $fetch<{ employees: EmployeeListItem[] }>('/api/payroll/employees')
    return response.employees
  }

  const fetchEmployee = async (employeeId: string): Promise<PayrollEmployee> => {
    const response = await $fetch<{ employee: PayrollEmployee }>(`/api/payroll/employees/${employeeId}`)
    return response.employee
  }

  const createEmployee = async (data: {
    name: string
    base_hourly_rate: number
    currency: string
  }): Promise<PayrollEmployee> => {
    const response = await $fetch<{ employee: PayrollEmployee }>('/api/payroll/employees', {
      method: 'POST',
      body: data
    })
    return response.employee
  }

  const updateEmployee = async (
    employeeId: string,
    data: Record<string, unknown>
  ): Promise<PayrollEmployee> => {
    const response = await $fetch<{ employee: PayrollEmployee }>(`/api/payroll/employees/${employeeId}`, {
      method: 'PATCH',
      body: data
    })
    return response.employee
  }

  const deleteEmployee = async (employeeId: string): Promise<void> => {
    await $fetch(`/api/payroll/employees/${employeeId}`, { method: 'DELETE' })
  }

  const fetchWeeks = async (employeeId: string): Promise<PayrollWeek[]> => {
    const response = await $fetch<{ weeks: PayrollWeek[] }>(`/api/payroll/employees/${employeeId}/weeks`)
    return response.weeks
  }

  const createWeek = async (
    employeeId: string,
    data: { start_date: string, weekly_tips?: number }
  ): Promise<PayrollWeek> => {
    const response = await $fetch<{ week: PayrollWeek }>(`/api/payroll/employees/${employeeId}/weeks`, {
      method: 'POST',
      body: data
    })
    return response.week
  }

  const updateWeekSchedule = async (
    employeeId: string,
    weekId: string,
    schedule: Record<string, unknown>
  ): Promise<PayrollWeek> => {
    const response = await $fetch<{ week: PayrollWeek }>(
      `/api/payroll/employees/${employeeId}/weeks/${weekId}/schedule`,
      {
        method: 'PATCH',
        body: { schedule }
      }
    )
    return response.week
  }

  const updateWeek = async (
    employeeId: string,
    weekId: string,
    data: { weekly_tips?: number, shift_rate?: number | null }
  ): Promise<PayrollWeek> => {
    const response = await $fetch<{ week: PayrollWeek }>(
      `/api/payroll/employees/${employeeId}/weeks/${weekId}`,
      {
        method: 'PATCH',
        body: data
      }
    )
    return response.week
  }

  const deleteWeek = async (employeeId: string, weekId: string): Promise<void> => {
    await $fetch(`/api/payroll/employees/${employeeId}/weeks/${weekId}`, { method: 'DELETE' })
  }

  return {
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    fetchWeeks,
    createWeek,
    updateWeekSchedule,
    updateWeek,
    deleteWeek
  }
}
