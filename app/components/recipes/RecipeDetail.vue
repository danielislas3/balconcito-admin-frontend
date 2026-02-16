<script setup lang="ts">
import type { Recipe } from '~/types/recipes'

const store = useRecipesStore()
const toast = useToast()

const targetYield = ref<number | undefined>(undefined)

const recipe = computed(() => store.activeRecipe)

// Reset calculator when recipe changes
watch(() => recipe.value?.id, () => {
  targetYield.value = undefined
})

const scaledIngredients = computed(() => {
  if (!recipe.value) return []
  const target = targetYield.value || recipe.value.baseYield
  return store.scaleIngredients(recipe.value.id, target)
})

const factor = computed(() => {
  if (!recipe.value || !targetYield.value) return 1
  return targetYield.value / recipe.value.baseYield
})

const hasStorageInstructions = computed(() => {
  if (!recipe.value?.storageInstructions) return false
  const si = recipe.value.storageInstructions
  return si.temperatura || si.vidaUtil || si.condiciones || si.notas
})

const copyIngredients = () => {
  if (!recipe.value) return

  const text = scaledIngredients.value.map(ing =>
    `${ing.quantity} ${ing.unit} ${ing.name}`
  ).join('\n')

  navigator.clipboard.writeText(text)
  toast.add({ title: 'Ingredientes copiados', color: 'success' })
}
</script>

<template>
  <div v-if="recipe" class="h-full flex flex-col bg-default/50">
    <!-- Header -->
    <div class="p-6 bg-default border-b border-default">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ recipe.name }}
          </h1>
          <p class="text-muted">
            {{ recipe.description }}
          </p>
        </div>
        <div class="flex gap-2">
          <!-- Future: Edit Button -->
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Calculator Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calculator" class="w-5 h-5 text-primary" />
              <h2 class="font-semibold">
                Calculadora de Rendimiento
              </h2>
            </div>
          </template>

          <div class="flex flex-col sm:flex-row gap-6 items-end">
            <div class="flex-1 w-full">
              <label class="block text-sm font-medium text-muted mb-1">
                Rendimiento Base (Receta Original)
              </label>
              <div class="text-lg font-mono p-2 bg-stone-100 dark:bg-stone-800 border border-default rounded text-gray-900 dark:text-white">
                {{ recipe.baseYield }} {{ recipe.yieldUnit }}
              </div>
            </div>

            <div class="flex items-center pb-3 text-muted">
              <UIcon name="i-lucide-arrow-right" class="w-6 h-6" />
            </div>

            <div class="flex-1 w-full">
              <label class="block text-sm font-medium text-primary font-bold mb-1">
                ¿Cuánto quieres preparar?
              </label>
              <div class="flex gap-2">
                <UInput
                  v-model.number="targetYield"
                  type="number"
                  :placeholder="recipe.baseYield.toString()"
                  class="flex-1"
                  size="lg"
                  :ui="{ base: 'text-lg font-bold text-primary' }"
                />
                <div class="flex items-center px-3 bg-stone-100 dark:bg-stone-800 rounded border border-default font-medium text-muted">
                  {{ recipe.yieldUnit }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="factor !== 1" class="mt-4 p-3 bg-primary/10 text-primary rounded text-sm flex items-center justify-center border border-primary/20">
            <UIcon name="i-lucide-scaling" class="w-4 h-4 mr-2" />
            Escalando receta por un factor de <span class="font-bold ml-1">x{{ factor.toFixed(2) }}</span>
          </div>
        </UCard>

        <!-- Ingredients -->
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <UIcon name="i-lucide-flask-conical" class="w-5 h-5 text-muted" />
                Ingredientes
              </h2>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-copy"
                label="Copiar"
                @click="copyIngredients"
              />
            </div>

            <div class="space-y-2">
              <div
                v-for="ing in scaledIngredients"
                :key="ing.name"
                class="p-3 flex justify-between items-center bg-default/40 rounded-lg border border-default hover:bg-primary/5 transition-colors"
              >
                <span class="text-gray-700 dark:text-gray-200">{{ ing.name }}</span>
                <span class="font-mono font-bold text-primary whitespace-nowrap">
                  {{ ing.quantity }} <span class="text-xs text-muted font-normal">{{ ing.unit }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div>
            <h2 class="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
              <UIcon name="i-lucide-chef-hat" class="w-5 h-5 text-muted" />
              Preparación
            </h2>

            <ol class="space-y-4 relative border-l border-default ml-3">
              <li
                v-for="step in recipe.steps"
                :key="step.order"
                class="mb-6 ml-6"
              >
                <span class="absolute flex items-center justify-center w-6 h-6 bg-default rounded-full -left-3 ring-4 ring-default text-xs font-bold text-primary border border-primary/20">
                  {{ step.order }}
                </span>
                <div class="p-4 bg-default rounded-lg border border-default">
                  <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {{ step.description }}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <!-- Storage Info -->
        <UCard v-if="hasStorageInstructions">
          <div class="flex gap-3">
            <UIcon name="i-lucide-snowflake" class="w-5 h-5 text-info shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">
                Conservación
              </h3>
              <dl class="space-y-1 text-sm">
                <div v-if="recipe.storageInstructions?.temperatura" class="flex gap-2">
                  <dt class="text-muted font-medium">Temperatura:</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ recipe.storageInstructions.temperatura }}</dd>
                </div>
                <div v-if="recipe.storageInstructions?.vidaUtil" class="flex gap-2">
                  <dt class="text-muted font-medium">Vida útil:</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ recipe.storageInstructions.vidaUtil }}</dd>
                </div>
                <div v-if="recipe.storageInstructions?.condiciones" class="flex gap-2">
                  <dt class="text-muted font-medium">Condiciones:</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ recipe.storageInstructions.condiciones }}</dd>
                </div>
                <div v-if="recipe.storageInstructions?.notas" class="flex gap-2">
                  <dt class="text-muted font-medium">Notas:</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ recipe.storageInstructions.notas }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <div v-else class="h-full flex items-center justify-center text-muted bg-default/50">
    <div class="text-center">
      <UIcon name="i-lucide-book-open" class="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p>Selecciona una receta para ver los detalles</p>
    </div>
  </div>
</template>
