<script setup lang="ts">
import type { PayrollEmployee } from '~/types/payroll'
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

definePageMeta({
  layout: 'default',
  requiresAuth: true,
  ssr: false
})

const router = useRouter()
const payrollStore = usePayrollStore()
const toast = useToast()
const { exportAllEmployees, exportEmployeeData } = usePayrollExport()

const breakpoints = useBreakpoints(breakpointsTailwind)
const lgAndLarger = breakpoints.greaterOrEqual('lg')

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
const newEmployeeName = ref('')
const newEmployeeRate = ref(450)
const newEmployeeCurrency = ref<'MXN' | 'USD' | 'EUR'>('MXN')
const employeeNameError = ref('')

// Refs para animaciones
const saveIndicatorVisible = ref(false)
const saveMessage = ref('Guardado automáticamente')

// Cargar datos al montar el componente
onMounted(async () => {
  await payrollStore.fetchEmployees()
})

// Funciones para empleados
const openAddEmployeeModal = () => {
  newEmployeeName.value = ''
  newEmployeeRate.value = 450
  newEmployeeCurrency.value = 'MXN'
  employeeNameError.value = ''
  showAddEmployeeModal.value = true
}

const closeAddEmployeeModal = () => {
  showAddEmployeeModal.value = false
  newEmployeeName.value = ''
  newEmployeeRate.value = 450
  newEmployeeCurrency.value = 'MXN'
  employeeNameError.value = ''
}

const handleAddEmployee = async () => {
  const result = await payrollStore.createEmployee(
    newEmployeeName.value,
    newEmployeeRate.value,
    newEmployeeCurrency.value
  )

  if (result.success) {
    toast.add({
      title: 'Éxito',
      description: 'Empleado agregado correctamente',
      color: 'success'
    })
    closeAddEmployeeModal()
    showSaveIndicator('Empleado agregado exitosamente')
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
      title: 'Éxito',
      description: 'Empleado eliminado correctamente',
      color: 'success'
    })
    showSaveIndicator('Empleado eliminado')
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'No se pudo eliminar el empleado',
      color: 'error'
    })
  }
}

// Funciones para semanas
const handleCreateWeek = async () => {
  // Calcular el siguiente lunes usando dayjs
  const dayjs = useDayjs()
  const today = dayjs()
  const monday = today.day() === 1 ? today : today.day(1) // Si es lunes, usar hoy, sino ir al lunes de esta semana
  const weekKey = monday.format('YYYY-MM-DD')

  const result = await payrollStore.createWeek(weekKey, 0)

  if (result.success) {
    toast.add({
      title: 'Éxito',
      description: 'Nueva semana creada',
      color: 'success'
    })
    showSaveIndicator('Nueva semana creada')
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'No se pudo crear la semana',
      color: 'error'
    })
  }
}

// Funciones de exportación
const handleExportAll = () => {
  exportAllEmployees(employees.value)
  showSaveIndicator('Reporte general exportado')
}

const handleExportEmployee = (employee: PayrollEmployee) => {
  exportEmployeeData(employee)
  showSaveIndicator(`Datos de ${employee.name} exportados`)
}

const handleViewEmployee = (employeeId: string) => {
  router.push(`/payroll/employee/${employeeId}`)
}

const showSaveIndicator = (message: string) => {
  saveMessage.value = message
  saveIndicatorVisible.value = true
  setTimeout(() => {
    saveIndicatorVisible.value = false
  }, 3000)
}

// Computed para tabs
const tabs = computed(() => [
  {
    id: 'schedules',
    label: 'Horarios',
    icon: 'i-lucide-calendar',
    badge: currentWeek.value ? undefined : '!'
  },
  {
    id: 'monthly',
    label: 'Mensual',
    icon: 'i-lucide-calendar-range',
    badge: undefined
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: 'i-lucide-bar-chart-3',
    badge: employees.value.length
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: 'i-lucide-settings'
  }
])
</script>

<template>
  <ClientOnly>
    <div
      class="min-h-screen w-full bg-linear-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 overflow-y-auto">

      <!-- Loading Overlay -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="loading" class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <UIcon name="i-lucide-loader-2" class="size-12 text-emerald-600 animate-spin" />
            <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Cargando...</p>
          </div>
        </div>
      </Transition>

      <!-- Indicador de guardado flotante - Responsive -->
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100" leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-full opacity-0">
        <div v-if="saveIndicatorVisible"
          class="fixed top-16 sm:top-20 right-2 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-lg sm:rounded-xl shadow-xl shadow-emerald-900/20 backdrop-blur-sm max-w-[calc(100vw-1rem)] sm:max-w-none">
          <UIcon name="i-lucide-check-circle-2" class="size-4 sm:size-5 animate-pulse flex-shrink-0" />
          <span class="font-medium text-sm sm:text-base tracking-wide truncate">{{ saveMessage }}</span>
        </div>
      </Transition>

      <!-- Header - Mobile Responsive -->
      <div
        class="bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-700 shadow-2xl shadow-emerald-900/30 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            <div class="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
              <div
                class="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
                <UIcon name="i-lucide-calculator" class="size-5 sm:size-6 lg:size-7 text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <h1 class="text-base sm:text-xl lg:text-3xl font-bold text-white tracking-tight truncate">Sistema de
                  Nóminas</h1>
                <p class="hidden sm:block text-xs lg:text-sm text-emerald-100/80 mt-0.5 truncate">Gestión de empleados y
                  pagos</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <!-- Mobile: Solo icono -->
              <UButton icon="i-lucide-user-plus" color="primary" variant="soft" size="sm" @click="openAddEmployeeModal"
                class="sm:hidden shadow-lg hover:shadow-xl transition-all duration-200" />
              <!-- Desktop: Con label -->
              <UButton label="Nuevo Empleado" icon="i-lucide-user-plus" color="primary" variant="soft"
                :size="lgAndLarger ? 'lg' : 'md'" @click="openAddEmployeeModal"
                class="hidden sm:flex shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation - Mobile Responsive with Scroll -->
      <div
        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-emerald-200/50 dark:border-emerald-800/50 sticky top-14 sm:top-16 lg:top-20 z-30">
        <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div class="flex gap-1 sm:gap-2 py-2 sm:py-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
              'group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 snap-start',
              activeTab === tab.id
                ? 'bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300'
            ]">
              <UIcon :name="tab.icon" class="size-3.5 sm:size-4 flex-shrink-0" />
              <span class="font-semibold whitespace-nowrap">{{ tab.label }}</span>
              <UBadge v-if="tab.badge" :color="activeTab === tab.id ? 'info' : 'success'" variant="solid" size="xs"
                class="ml-0.5 sm:ml-1">
                {{ tab.badge }}
              </UBadge>
              <!-- Indicador activo -->
              <div v-if="activeTab === tab.id"
                class="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-600 rounded-full">
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="payroll-content">
          <!-- PESTAÑA DE HORARIOS -->
          <PayrollOrganismsSchedulesTab v-show="activeTab === 'schedules'" @add-employee="openAddEmployeeModal"
            @delete-employee="handleDeleteEmployee" @create-week="handleCreateWeek" />

          <!-- PESTAÑA MENSUAL -->
          <PayrollOrganismsMonthlyDashboard v-show="activeTab === 'monthly'" />

          <!-- PESTAÑA DE REPORTES -->
          <PayrollOrganismsReportsTab v-show="activeTab === 'reports'" @export-all="handleExportAll"
            @export-employee="handleExportEmployee" @view-employee="handleViewEmployee" />

          <!-- PESTAÑA DE CONFIGURACIÓN -->
          <PayrollOrganismsSettingsTab v-show="activeTab === 'settings'" />
        </div>
      </div>

      <!-- Modal Agregar Empleado -->
      <UModal v-model:open="showAddEmployeeModal" title="Agregar Nuevo Empleado"
        description="Ingresa los datos del nuevo empleado" :ui="{ content: 'w-full max-w-md' }">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Nombre del Empleado" required :error="employeeNameError">
              <UInput v-model="newEmployeeName" placeholder="Ej. María García" @keyup.enter="handleAddEmployee"
                autofocus />
            </UFormField>

            <UFormField label="Tarifa por Hora" required>
              <UInput v-model.number="newEmployeeRate" type="number" placeholder="450" />
            </UFormField>

            <UFormField label="Moneda" required>
              <USelect v-model="newEmployeeCurrency" :options="[
                { value: 'MXN', label: 'Pesos Mexicanos (MXN)' },
                { value: 'USD', label: 'Dólares (USD)' },
                { value: 'EUR', label: 'Euros (EUR)' }
              ]" option-attribute="label" value-attribute="value" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="neutral" variant="ghost" @click="closeAddEmployeeModal" />
            <UButton label="Agregar" icon="i-lucide-check" color="success" @click="handleAddEmployee"
              :loading="loading" />
          </div>
        </template>
      </UModal>
    </div>
  </ClientOnly>
</template>
