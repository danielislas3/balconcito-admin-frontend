<script setup lang="ts">
import type { Ingredient } from '~/types/recipes'
import IngredientForm from '~/components/recipes/atoms/IngredientForm.vue'

export interface RecipeIngredientListProps {
  ingredients: Ingredient[]
}

const props = defineProps<RecipeIngredientListProps>()

const emit = defineEmits<{
  'update:ingredients': [ingredients: Ingredient[]]
}>()

const addIngredient = () => {
  const newIngredients = [...props.ingredients, { name: '', quantity: 0, unit: '' }]
  emit('update:ingredients', newIngredients)
}

const removeIngredient = (index: number) => {
  const newIngredients = props.ingredients.filter((_, i) => i !== index)
  emit('update:ingredients', newIngredients)
}

const moveIngredientUp = (index: number) => {
  if (index <= 0) return
  const newIngredients = [...props.ingredients]
  const temp = newIngredients[index]!
  newIngredients[index] = newIngredients[index - 1]!
  newIngredients[index - 1] = temp
  emit('update:ingredients', newIngredients)
}

const moveIngredientDown = (index: number) => {
  if (index >= props.ingredients.length - 1) return
  const newIngredients = [...props.ingredients]
  const temp = newIngredients[index]!
  newIngredients[index] = newIngredients[index + 1]!
  newIngredients[index + 1] = temp
  emit('update:ingredients', newIngredients)
}

const updateIngredient = (index: number, ingredient: Ingredient) => {
  const newIngredients = [...props.ingredients]
  newIngredients[index] = ingredient
  emit('update:ingredients', newIngredients)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">
        Ingredientes
      </h3>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        size="sm"
        label="Agregar Ingrediente"
        @click="addIngredient"
      />
    </div>

    <div v-if="ingredients.length === 0" class="text-center py-8 text-muted border-2 border-dashed border-default rounded-lg">
      <UIcon name="i-lucide-flask-conical" class="w-12 h-12 mx-auto opacity-20 mb-2" />
      <p>No hay ingredientes aún</p>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="ghost"
        size="sm"
        class="mt-2"
        label="Agregar primer ingrediente"
        @click="addIngredient"
      />
    </div>

    <div v-else class="space-y-3">
      <IngredientForm
        v-for="(ingredient, index) in localIngredients"
        :key="index"
        :ingredient="ingredient"
        :index="index"
        :can-move-up="index > 0"
        :can-move-down="index < localIngredients.length - 1"
        @update:ingredient="(updated) => updateIngredient(index, updated)"
        @move-up="moveIngredientUp(index)"
        @move-down="moveIngredientDown(index)"
        @remove="removeIngredient(index)"
      />
    </div>
  </div>
</template>
