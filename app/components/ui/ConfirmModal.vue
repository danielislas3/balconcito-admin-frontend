<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  confirmColor?: 'error' | 'primary' | 'warning'
  confirmIcon?: string
  loading?: boolean
}>(), {
  title: 'Confirmar acción',
  description: 'Esta acción no se puede deshacer.',
  confirmLabel: 'Eliminar',
  confirmColor: 'error',
  confirmIcon: 'i-lucide-trash-2',
  loading: false
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="props.title"
    :description="props.description"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        label="Cancelar"
        color="neutral"
        variant="outline"
        @click="open = false"
      />
      <UButton
        :label="props.confirmLabel"
        :color="props.confirmColor"
        :icon="props.confirmIcon"
        :loading="props.loading"
        @click="handleConfirm"
      />
    </template>
  </UModal>
</template>
