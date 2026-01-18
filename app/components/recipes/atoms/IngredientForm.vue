<script setup lang="ts">
import type { Ingredient } from '~/types/recipes'

export interface IngredientFormProps {
  ingredient: Ingredient
  index: number
  canMoveUp?: boolean
  canMoveDown?: boolean
}

const props = withDefaults(defineProps<IngredientFormProps>(), {
  canMoveUp: false,
  canMoveDown: false
})

const emit = defineEmits<{
  'update:ingredient': [ingredient: Ingredient]
  'move-up': []
  'move-down': []
  'remove': []
}>()

const localIngredient = ref<Ingredient>({ ...props.ingredient })

watch(() => props.ingredient, (newIngredient) => {
  localIngredient.value = { ...newIngredient }
}, { deep: true })

watch(localIngredient, (newIngredient) => {
  emit('update:ingredient', { ...newIngredient })
}, { deep: true })
</script>

<template>
  <div class="p-4 border rounded-lg border-default bg-default/40 space-y-3">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-muted">#{{ index + 1 }}</span>
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

    <div class="grid grid-cols-12 gap-3">
      <div class="col-span-7">
        <UFormField label="Nombre" required>
          <UInput v-model="localIngredient.name" placeholder="Ej: Azúcar refinada blanca" />
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField label="Cantidad" required>
          <UInput
            v-model.number="localIngredient.quantity"
            type="number"
            step="0.01"
            placeholder="Ej: 8"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UFormField label="Unidad" required>
          <UInput v-model="localIngredient.unit" placeholder="Ej: kg" />
        </UFormField>
      </div>
    </div>

    <UFormField label="Notas (opcional)">
      <UInput v-model="localIngredient.notes" placeholder="Notas adicionales" />
    </UFormField>
  </div>
</template>
