/**
 * Composable para sincronizar el estado del payroll con la URL
 * Permite persistir la selección de empleado y semana al refrescar
 */
import { usePayrollStore } from '~/stores/payroll'
import { storeToRefs } from 'pinia'

export const usePayrollRouteSync = () => {
  const route = useRoute()
  const router = useRouter()
  const payrollStore = usePayrollStore()
  const { employees, currentEmployee, currentEmployeeId, currentWeekId } = storeToRefs(payrollStore)

  // Flag para evitar loops de actualización durante la restauración inicial
  let isRestoringFromRoute = false

  /**
   * Restaura la selección desde los query params de la URL
   * Se debe llamar después de cargar los empleados
   */
  const restoreFromRoute = async () => {
    isRestoringFromRoute = true

    const employeeId = route.query.employee as string
    const weekId = route.query.week as string

    // Restaurar empleado si existe en la URL y en los datos
    if (employeeId && employees.value.find(e => e.id === employeeId)) {
      payrollStore.currentEmployeeId = employeeId

      // Esperar a que se actualice el DOM
      await nextTick()

      // Restaurar semana si existe en la URL y pertenece al empleado actual
      if (weekId && currentEmployee.value?.weeks.find(w => w.id === weekId)) {
        payrollStore.currentWeekId = weekId
      }
    }

    // Esperar un ciclo más para asegurar que todo esté actualizado
    await nextTick()
    isRestoringFromRoute = false
  }

  /**
   * Sincroniza cambios de empleado con la URL
   */
  const syncEmployeeToRoute = () => {
    watch(currentEmployeeId, (newId, _oldId) => {
      // No actualizar URL durante restauración inicial
      if (isRestoringFromRoute) return

      if (newId && newId !== route.query.employee) {
        // Al cambiar empleado, limpiar la semana seleccionada
        router.replace({
          query: {
            ...route.query,
            employee: newId,
            week: undefined
          }
        })
      }
    })
  }

  /**
   * Sincroniza cambios de semana con la URL
   */
  const syncWeekToRoute = () => {
    watch(currentWeekId, (newId) => {
      // No actualizar URL durante restauración inicial
      if (isRestoringFromRoute) return

      if (newId && newId !== route.query.week) {
        // Actualizar query param de semana
        router.replace({
          query: {
            ...route.query,
            week: newId
          }
        })
      } else if (!newId && route.query.week) {
        // Limpiar semana de la URL si se deselecciona
        const query = { ...route.query }
        delete query.week
        router.replace({ query })
      }
    })
  }

  /**
   * Inicializa la sincronización completa
   * Llama a esto en onMounted después de fetchEmployees
   */
  const initRouteSync = async () => {
    // Primero configurar los watchers
    syncEmployeeToRoute()
    syncWeekToRoute()

    // Luego restaurar desde la URL
    await restoreFromRoute()
  }

  return {
    restoreFromRoute,
    syncEmployeeToRoute,
    syncWeekToRoute,
    initRouteSync
  }
}
