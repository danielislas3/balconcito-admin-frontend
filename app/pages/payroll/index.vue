<script setup lang="ts">
import type { PayrollEmployee } from '~/types/payroll'
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
  requiresAuth: true,
  ssr: false
})

const router = useRouter()
const payrollStore = usePayrollStore()
const toast = useToast()
const { exportAllEmployees, exportEmployeeData } = usePayrollExport()

// Store refs
const {
  employees,
  currentEmployee,
  currentWeek,
  activeTab,
  loading
} = storeToRefs(payrollStore)

// Modales
const showAddEmployeeModal = ref(false)
const showCreateWeekModal = ref(false)
const newEmployeeName = ref('')
const newEmployeeRate = ref(450)
const newEmployeeCurrency = ref<'MXN' | 'USD' | 'EUR'>('MXN')
const rateType = ref<'hourly' | 'daily' | 'weekly'>('hourly')
const hoursPerShift = ref(8)
const daysPerWeek = ref(6)
const employeeNameError = ref('')

const rateEquivalences = computed(() => {
  const rate = newEmployeeRate.value || 0

  switch (rateType.value) {
    case 'hourly':
      return {
        hourly: rate,
        daily: rate * hoursPerShift.value,
        weekly: rate * hoursPerShift.value * daysPerWeek.value
      }
    case 'daily':
      return {
        hourly: rate / hoursPerShift.value,
        daily: rate,
        weekly: rate * daysPerWeek.value
      }
    case 'weekly':
      return {
        hourly: rate / (hoursPerShift.value * daysPerWeek.value),
        daily: rate / daysPerWeek.value,
        weekly: rate
      }
    default:
      return { hourly: 0, daily: 0, weekly: 0 }
  }
})

const rateLabel = computed(() => {
  switch (rateType.value) {
    case 'hourly': return 'Tarifa por Hora'
    case 'daily': return 'Tarifa por Turno (Día)'
    case 'weekly': return 'Tarifa por Semana'
    default: return 'Tarifa'
  }
})

// Composable para sincronizar con la URL
const { initRouteSync } = usePayrollRouteSync()

// Cargar datos al montar el componente
onMounted(async () => {
  await payrollStore.fetchEmployees()
  await initRouteSync()
})

// Funciones para empleados
const openAddEmployeeModal = () => {
  newEmployeeName.value = ''
  newEmployeeRate.value = 450
  newEmployeeCurrency.value = 'MXN'
  rateType.value = 'hourly'
  hoursPerShift.value = 8
  daysPerWeek.value = 6
  employeeNameError.value = ''
  showAddEmployeeModal.value = true
}

const closeAddEmployeeModal = () => {
  showAddEmployeeModal.value = false
  newEmployeeName.value = ''
  newEmployeeRate.value = 450
  newEmployeeCurrency.value = 'MXN'
  rateType.value = 'hourly'
  employeeNameError.value = ''
}

const handleAddEmployee = async () => {
  const hourlyRate = rateEquivalences.value.hourly

  const result = await payrollStore.createEmployee(
    newEmployeeName.value,
    hourlyRate,
    newEmployeeCurrency.value
  )

  if (result.success) {
    toast.add({
      title: 'Empleado agregado',
      description: `${newEmployeeName.value} ha sido agregado correctamente`,
      color: 'success'
    })
    closeAddEmployeeModal()
  } else {
    employeeNameError.value = result.error || 'Error desconocido'
  }
}

const handleDeleteEmployee = async () => {
  if (!currentEmployee.value) return

  const name = currentEmployee.value.name
  if (!confirm(`¿Estás seguro de que quieres eliminar a ${name}?\n\nSe perderán todos sus horarios y no se puede deshacer.`)) {
    return
  }

  const result = await payrollStore.deleteCurrentEmployee()

  if (result.success) {
    toast.add({
      title: 'Empleado eliminado',
      description: `${name} ha sido eliminado`,
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'No se pudo eliminar el empleado',
      color: 'error'
    })
  }
}

// Funciones para semanas
const handleCreateWeek = () => {
  showCreateWeekModal.value = true
}

const onWeekCreated = () => {
  toast.add({
    title: 'Semana creada',
    description: 'La nueva semana ha sido creada',
    color: 'success'
  })
}

// Funciones de exportación e importación
const handleExportAll = () => {
  exportAllEmployees(employees.value)
  toast.add({ title: 'Exportado', description: 'Reporte general exportado', color: 'success' })
}

const handleExportEmployee = (employee: PayrollEmployee) => {
  exportEmployeeData(employee)
  toast.add({ title: 'Exportado', description: `Datos de ${employee.name} exportados`, color: 'success' })
}

const handleImportData = () => {
  toast.add({
    title: 'En desarrollo',
    description: 'La importación de datos estará disponible próximamente',
    color: 'info'
  })
}

const handleClearAll = () => {
  toast.add({
    title: 'En desarrollo',
    description: 'La limpieza de datos estará disponible próximamente',
    color: 'info'
  })
}

const handleViewEmployee = (employeeId: string) => {
  router.push(`/payroll/employee/${employeeId}`)
}

// Tabs configuration for UTabs
const tabItems = computed(() => [
  {
    label: 'Horarios',
    icon: 'i-lucide-calendar',
    value: 'schedules',
    badge: currentWeek.value ? undefined : { color: 'warning' as const, label: '!' }
  },
  {
    label: 'Mensual',
    icon: 'i-lucide-calendar-range',
    value: 'monthly'
  },
  {
    label: 'Reportes',
    icon: 'i-lucide-bar-chart-3',
    value: 'reports',
    badge: employees.value.length ? { color: 'primary' as const, label: String(employees.value.length) } : undefined
  },
  {
    label: 'Configuración',
    icon: 'i-lucide-settings',
    value: 'settings'
  }
])
</script>

<template>
  <UDashboardPanel id="payroll" :loading="loading">
    <template #header>
      <UDashboardNavbar title="Sistema de Nóminas" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-user-plus"
            class="lg:hidden"
            color="primary"
            variant="soft"
            @click="openAddEmployeeModal"
          />
          <UButton
            label="Nuevo Empleado"
            icon="i-lucide-user-plus"
            color="primary"
            class="hidden lg:flex"
            @click="openAddEmployeeModal"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UTabs
            v-model="activeTab"
            :items="tabItems"
            variant="link"
            size="sm"
          >
            <template #item="{ item }">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="size-4" />
                <span>{{ item.label }}</span>
                <UBadge
                  v-if="item.badge"
                  :color="item.badge.color"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.badge.label }}
                </UBadge>
              </div>
            </template>
          </UTabs>
        </template>

        <template #right>
          <UBadge v-if="currentEmployee" color="primary" variant="subtle">
            {{ currentEmployee.name }}
          </UBadge>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- PESTAÑA DE HORARIOS -->
      <PayrollOrganismsSchedulesTab
        v-show="activeTab === 'schedules'"
        @add-employee="openAddEmployeeModal"
        @delete-employee="handleDeleteEmployee"
        @create-week="handleCreateWeek"
      />

      <!-- PESTAÑA MENSUAL -->
      <PayrollOrganismsMonthlyDashboard v-show="activeTab === 'monthly'" />

      <!-- PESTAÑA DE REPORTES -->
      <PayrollOrganismsReportsTab
        v-show="activeTab === 'reports'"
        @export-all="handleExportAll"
        @export-employee="handleExportEmployee"
        @view-employee="handleViewEmployee"
      />

      <!-- PESTAÑA DE CONFIGURACIÓN -->
      <PayrollOrganismsSettingsTab
        v-show="activeTab === 'settings'"
        @export-system="handleExportAll"
        @import-data="handleImportData"
        @clear-all="handleClearAll"
      />
    </template>
  </UDashboardPanel>

  <!-- Modal Agregar Empleado -->
  <UModal
    v-model:open="showAddEmployeeModal"
    title="Agregar Nuevo Empleado"
    description="Ingresa los datos del nuevo empleado"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nombre del Empleado" required :error="employeeNameError">
          <UInput
            v-model="newEmployeeName"
            placeholder="Ej. María García"
            @keyup.enter="handleAddEmployee"
            autofocus
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Moneda" required>
            <USelect
              v-model="newEmployeeCurrency"
              :items="[
                { id: 'MXN', label: 'MXN' },
                { id: 'USD', label: 'USD' },
                { id: 'EUR', label: 'EUR' }
              ]"
              value-key="id"
            />
          </UFormField>

          <UFormField label="Tipo de Tarifa" required>
            <USelect
              v-model="rateType"
              :items="[
                { id: 'hourly', label: 'Por Hora' },
                { id: 'daily', label: 'Por Día' },
                { id: 'weekly', label: 'Por Semana' }
              ]"
              value-key="id"
            />
          </UFormField>
        </div>

        <UFormField :label="rateLabel" required>
          <UInput v-model.number="newEmployeeRate" type="number" step="0.01" placeholder="450" />
        </UFormField>

        <!-- Equivalencias calculadas -->
        <UCard variant="subtle">
          <div class="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">
            Equivalencias Calculadas
          </div>
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div class="text-center">
              <div class="text-xs text-muted">Por Hora</div>
              <div class="font-bold text-hours tabular-nums">
                {{ rateEquivalences.hourly.toFixed(2) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-xs text-muted">Por Día</div>
              <div class="font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                {{ rateEquivalences.daily.toFixed(2) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-xs text-muted">Por Semana</div>
              <div class="font-bold text-money tabular-nums">
                {{ rateEquivalences.weekly.toFixed(2) }}
              </div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-default text-xs text-muted">
            Basado en {{ hoursPerShift }}h/día × {{ daysPerWeek }} días/semana
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="closeAddEmployeeModal" />
        <UButton
          label="Agregar"
          icon="i-lucide-check"
          color="primary"
          @click="handleAddEmployee"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>

  <!-- Modal: Crear Nueva Semana -->
  <PayrollMoleculesCreateWeekModal
    v-model:open="showCreateWeekModal"
    :current-employee="currentEmployee"
    :loading="loading"
    @created="onWeekCreated"
  />
</template>
