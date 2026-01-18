<script setup lang="ts">
import type { RecipeStep } from '~/types/recipes'
import StepForm from '~/components/recipes/atoms/StepForm.vue'

export interface RecipeStepListProps {
  steps: RecipeStep[]
}

const props = defineProps<RecipeStepListProps>()

const emit = defineEmits<{
  'update:steps': [steps: RecipeStep[]]
}>()

const localSteps = ref<RecipeStep[]>([...props.steps])

watch(() => props.steps, (newSteps) => {
  localSteps.value = [...newSteps]
}, { deep: true })

watch(localSteps, (newSteps) => {
  emit('update:steps', [...newSteps])
}, { deep: true })

const addStep = () => {
  const nextOrder = localSteps.value.length + 1
  localSteps.value.push({ description: '', order: nextOrder })
}

const removeStep = (index: number) => {
  localSteps.value.splice(index, 1)
  // Re-number remaining steps
  localSteps.value.forEach((step, i) => {
    step.order = i + 1
  })
}

const moveStepUp = (index: number) => {
  if (index <= 0) return
  const steps = localSteps.value
  const temp = steps[index]!
  steps[index] = steps[index - 1]!
  steps[index - 1] = temp
  // Re-number steps
  steps.forEach((step, i) => {
    step.order = i + 1
  })
}

const moveStepDown = (index: number) => {
  if (index >= localSteps.value.length - 1) return
  const steps = localSteps.value
  const temp = steps[index]!
  steps[index] = steps[index + 1]!
  steps[index + 1] = temp
  // Re-number steps
  steps.forEach((step, i) => {
    step.order = i + 1
  })
}

const updateStep = (index: number, step: RecipeStep) => {
  localSteps.value[index] = step
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">
        Pasos de Preparación
      </h3>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        size="sm"
        label="Agregar Paso"
        @click="addStep"
      />
    </div>

    <div v-if="localSteps.length === 0" class="text-center py-8 text-muted border-2 border-dashed border-default rounded-lg">
      <UIcon name="i-lucide-chef-hat" class="w-12 h-12 mx-auto opacity-20 mb-2" />
      <p>No hay pasos de preparación aún</p>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="ghost"
        size="sm"
        class="mt-2"
        label="Agregar primer paso"
        @click="addStep"
      />
    </div>

    <div v-else class="space-y-4">
       <StepForm
        v-for="(step, index) in localSteps"
        :key="index"
        :step="step"
        :index="index"
        :can-move-up="index > 0"
        :can-move-down="index < localSteps.length - 1"
        @update:step="(updated) => updateStep(index, updated)"
        @move-up="moveStepUp(index)"
        @move-down="moveStepDown(index)"
        @remove="removeStep(index)"
      />
    </div>
  </div>
</template>
