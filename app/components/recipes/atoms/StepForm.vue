<script setup lang="ts">
import type { RecipeStep } from '~/types/recipes'

export interface StepFormProps {
  step: RecipeStep
  index: number
  canMoveUp?: boolean
  canMoveDown?: boolean
}

const props = withDefaults(defineProps<StepFormProps>(), {
  canMoveUp: false,
  canMoveDown: false
})

const emit = defineEmits<{
  'update:step': [step: RecipeStep]
  'move-up': []
  'move-down': []
  'remove': []
}>()

const localStep = ref<RecipeStep>({ ...props.step })

watch(() => props.step, (newStep) => {
  localStep.value = { ...newStep }
}, { deep: true })

watch(localStep, (newStep) => {
  emit('update:step', { ...newStep })
}, { deep: true })
</script>

<template>
  <div class="p-4 border rounded-lg border-default bg-default/40 space-y-3">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-bold rounded-full">
          {{ step.order }}
        </span>
        <span class="font-medium">Paso {{ step.order }}</span>
        <div class="flex gap-1">
          <UButton
            icon="i-lucide-arrow-up"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            :disabled="!canMoveUp"
            title="Mover arriba"
            @click="emit('move-up')"
          />
          <UButton
            icon="i-lucide-arrow-down"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            :disabled="!canMoveDown"
            title="Mover abajo"
            @click="emit('move-down')"
          />
        </div>
      </div>
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        :padded="false"
        title="Eliminar"
        @click="emit('remove')"
      />
    </div>

    <UFormField label="Descripción" required>
      <UTextarea
        v-model="localStep.description"
        placeholder="Describe este paso de la preparación..."
        :rows="3"
      />
    </UFormField>
  </div>
</template>
