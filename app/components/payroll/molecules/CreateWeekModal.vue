<script setup lang="ts">
import type { PayrollEmployee } from '~/types/payroll'
import { usePayrollStore } from '~/stores/payroll'

interface CreateWeekModalProps {
  open: boolean
  currentEmployee: PayrollEmployee | null
  loading?: boolean
}

const props = defineProps<CreateWeekModalProps>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
}>()

const payrollStore = usePayrollStore()
const toast = useToast()
const dayjs = useDayjs()

const newWeekStartDate = ref('')
const weekDateError = ref('')

// Inicializar con el lunes de esta semana cuando se abre
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const today = dayjs()
    const monday = today.day() === 1 ? today : today.day(1)
    newWeekStartDate.value = monday.format('YYYY-MM-DD')
    weekDateError.value = ''
  }
})

const confirmCreateWeek = async () => {
  weekDateError.value = ''

  if (!newWeekStartDate.value) {
    weekDateError.value = 'Selecciona una fecha'
    return
  }

  const selectedDate = dayjs(newWeekStartDate.value)

  // Convertir a lunes si no es lunes
  const monday = selectedDate.day() === 1 ? selectedDate : selectedDate.day(1)
  const weekKey = monday.format('YYYY-MM-DD')

  // Verificar si la semana ya existe
  const existingWeek = props.currentEmployee?.weeks.find(w => w.startDate === weekKey)
  if (existingWeek) {
    weekDateError.value = `La semana del ${monday.format('DD/MM/YYYY')} ya existe`
    return
  }

  const result = await payrollStore.createWeek(weekKey, 0)

  if (result.success) {
    toast.add({
      title: 'Éxito',
      description: `Semana del ${monday.format('DD/MM/YYYY')} creada`,
      color: 'success'
    })
    emit('update:open', false)
    emit('created')
  } else {
    weekDateError.value = result.error || 'No se pudo crear la semana'
  }
}

const setQuickDate = (type: 'current' | 'next' | 'previous') => {
  const today = dayjs()
  const monday = today.day() === 1 ? today : today.day(1)

  switch (type) {
    case 'current':
      newWeekStartDate.value = monday.format('YYYY-MM-DD')
      break
    case 'next':
      newWeekStartDate.value = monday.add(7, 'day').format('YYYY-MM-DD')
      break
    case 'previous':
      newWeekStartDate.value = monday.subtract(7, 'day').format('YYYY-MM-DD')
      break
  }
  weekDateError.value = ''
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)" title="Crear Nueva Semana"
    description="Selecciona la fecha de inicio de la semana (se ajustará automáticamente al lunes)">
    <template #body>
      <div class="space-y-4">
        <!-- Date Picker -->
        <UFormField label="Fecha de inicio" required :error="weekDateError">
          <input
            v-model="newWeekStartDate"
            type="date"
            class="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <template #hint>
            <span class="text-xs text-muted">
              Se creará la semana del lunes más cercano a esta fecha
            </span>
          </template>
        </UFormField>

        <!-- Semanas existentes -->
        <div v-if="currentEmployee && currentEmployee.weeks.length > 0" class="mt-4">
          <p class="text-sm font-medium mb-2">Semanas existentes:</p>
          <div class="max-h-40 overflow-y-auto space-y-1 p-2 bg-stone-50 dark:bg-stone-900 rounded border border-default">
            <div
              v-for="week in currentEmployee.weeks"
              :key="week.id"
              class="text-xs text-muted flex items-center gap-2"
            >
              <UIcon name="i-lucide-calendar-check" class="size-3" />
              <span>Semana del {{ dayjs(week.startDate).format('DD/MM/YYYY') }}</span>
            </div>
          </div>
        </div>

        <!-- Botones de acceso rápido -->
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            @click="setQuickDate('current')"
            class="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded transition-colors"
          >
            Esta semana
          </button>
          <button
            type="button"
            @click="setQuickDate('next')"
            class="px-3 py-1.5 text-xs font-medium bg-sky-100 dark:bg-sky-900/30 hover:bg-sky-200 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded transition-colors"
          >
            Próxima semana
          </button>
          <button
            type="button"
            @click="setQuickDate('previous')"
            class="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded transition-colors"
          >
            Semana pasada
          </button>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton label="Crear Semana" icon="i-lucide-calendar-plus" color="primary" @click="confirmCreateWeek"
          :loading="loading" />
      </div>
    </template>
  </UModal>
</template>
