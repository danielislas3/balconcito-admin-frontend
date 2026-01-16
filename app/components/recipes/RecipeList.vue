<script setup lang="ts">
import type { Recipe, RecipeCategory } from '~/types/recipes'
import type { Ref } from 'vue'

const store = useRecipesStore()
const toast = useToast()

const showFormModal = ref(false)
const formRecipe = ref<Partial<Recipe>>({})
const isEditing = ref(false)
const activeTab = ref('basic')

const categoryColors: Record<string, string> = {
  Salsas: 'red',
  Jarabes: 'amber',
  Sazonadores: 'orange',
  Bebidas: 'blue',
  Preparados: 'emerald'
}

const categoryOptions = ['Salsas', 'Jarabes', 'Sazonadores', 'Bebidas', 'Preparados'].map(c => ({ value: c, label: c }))

const handleCreateRecipe = () => {
  isEditing.value = false
  activeTab.value = 'basic'
  formRecipe.value = {
    name: '',
    description: '',
    category: 'Salsas',
    baseYield: 1,
    yieldUnit: 'kg',
    ingredients: [],
    steps: [],
    storageInstructions: ''
  }
  showFormModal.value = true
}

const handleEditRecipe = (recipe: Recipe) => {
  isEditing.value = true
  activeTab.value = 'basic'
  formRecipe.value = { ...recipe }
  showFormModal.value = true
}

const saveRecipe = () => {
  if (!formRecipe.value.name || !formRecipe.value.category || !formRecipe.value.baseYield || !formRecipe.value.yieldUnit) {
    toast.add({ title: 'Error', description: 'Completa los campos requeridos', color: 'error' })
    return
  }

  // Filtrar ingredientes vacíos y validar
  const ingredients = (formRecipe.value.ingredients || [])
    .filter(ing => ing.name?.trim() && ing.quantity > 0 && ing.unit?.trim())
    .map(ing => ({
      ...ing,
      name: ing.name.trim(),
      unit: ing.unit.trim(),
      notes: ing.notes?.trim() || undefined
    }))

  // Filtrar pasos vacíos y validar
  const steps = (formRecipe.value.steps || [])
    .filter(step => step.description?.trim())
    .map((step, index) => ({
      description: step.description.trim(),
      order: index + 1
    }))

  // Mostrar advertencias si hay datos incompletos
  const totalIngredients = formRecipe.value.ingredients?.length || 0
  const totalSteps = formRecipe.value.steps?.length || 0
  const filteredIngredients = ingredients.length
  const filteredSteps = steps.length

  if (totalIngredients > 0 && filteredIngredients < totalIngredients) {
    toast.add({
      title: 'Advertencia',
      description: `${totalIngredients - filteredIngredients} ingredientes fueron omitidos por falta de información`,
      color: 'warning'
    })
  }

  if (totalSteps > 0 && filteredSteps < totalSteps) {
    toast.add({
      title: 'Advertencia',
      description: `${totalSteps - filteredSteps} pasos fueron omitidos por estar vacíos`,
      color: 'warning'
    })
  }

  const recipe: Recipe = {
    id: formRecipe.value.id || generateId(formRecipe.value.name),
    name: formRecipe.value.name,
    description: formRecipe.value.description || '',
    category: formRecipe.value.category as RecipeCategory,
    baseYield: formRecipe.value.baseYield,
    yieldUnit: formRecipe.value.yieldUnit,
    ingredients,
    steps,
    storageInstructions: formRecipe.value.storageInstructions || '',
    lastUpdated: new Date()
  }

  if (recipe.id && store.recipes.some((r: Recipe) => r.id === recipe.id)) {
    store.updateRecipe(recipe)
    toast.add({
      title: 'Receta actualizada',
      description: `${recipe.name} ha sido actualizada`,
      color: 'success'
    })
  } else {
    store.addRecipe(recipe)
    toast.add({
      title: 'Receta creada',
      description: `${recipe.name} ha sido creada`,
      color: 'success'
    })
  }

  showFormModal.value = false
  formRecipe.value = {}
}

const handleDeleteRecipe = (id: string) => {
  const recipe = store.recipes.find((r: Recipe) => r.id === id)
  if (recipe && confirm(`¿Seguro que quieres eliminar "${recipe.name}"?`)) {
    store.deleteRecipe(id)
    toast.add({
      title: 'Receta eliminada',
      description: `${recipe.name} ha sido eliminada`,
      color: 'warning'
    })
  }
}

const generateId = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Ingredient management
const addIngredient = () => {
  if (!formRecipe.value.ingredients) formRecipe.value.ingredients = []
  formRecipe.value.ingredients.push({ name: '', quantity: 0, unit: '' })
}

const removeIngredient = (index: number) => {
  if (formRecipe.value.ingredients) {
    formRecipe.value.ingredients.splice(index, 1)
  }
}

const moveIngredientUp = (index: number) => {
  if (!formRecipe.value.ingredients || index <= 0) return
  const ingredients = formRecipe.value.ingredients
  const temp = ingredients[index]!
  ingredients[index] = ingredients[index - 1]!
  ingredients[index - 1] = temp
}

const moveIngredientDown = (index: number) => {
  if (!formRecipe.value.ingredients || index >= formRecipe.value.ingredients.length - 1) return
  const ingredients = formRecipe.value.ingredients
  const temp = ingredients[index]!
  ingredients[index] = ingredients[index + 1]!
  ingredients[index + 1] = temp
}

// Step management
const addStep = () => {
  if (!formRecipe.value.steps) formRecipe.value.steps = []
  const nextOrder = formRecipe.value.steps.length + 1
  formRecipe.value.steps.push({ description: '', order: nextOrder })
}

const removeStep = (index: number) => {
  if (formRecipe.value.steps) {
    formRecipe.value.steps.splice(index, 1)
    // Re-number remaining steps
    formRecipe.value.steps.forEach((step, i) => {
      step.order = i + 1
    })
  }
}

const moveStepUp = (index: number) => {
  if (!formRecipe.value.steps || index <= 0) return
  const steps = formRecipe.value.steps
  const temp = steps[index]!
  steps[index] = steps[index - 1]!
  steps[index - 1] = temp
  // Re-number steps
  steps.forEach((step, i) => {
    step.order = i + 1
  })
}

const moveStepDown = (index: number) => {
  if (!formRecipe.value.steps || index >= formRecipe.value.steps.length - 1) return
  const steps = formRecipe.value.steps
  const temp = steps[index]!
  steps[index] = steps[index + 1]!
  steps[index + 1] = temp
  // Re-number steps
  steps.forEach((step, i) => {
    step.order = i + 1
  })
}
</script>

<template>
  <div class="flex flex-col h-full border-r border-default bg-default">
    <div class="p-4 border-b border-default">
      <div class="flex items-center gap-3">
        <div class="flex-1">
           <UInput
            v-model="store.searchQuery"
            icon="i-lucide-search"
            placeholder="Buscar receta..."
            size="md"
          >
            <template #trailing>
              <div v-if="store.searchQuery" class="flex items-center">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  size="xs"
                  :padded="false"
                  @click="store.searchQuery = ''"
                />
              </div>
            </template>
          </UInput>
        </div>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          title="Nueva receta"
          @click="handleCreateRecipe"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="store.filteredRecipes.length === 0" class="p-8 text-center text-muted">
        <p class="text-sm">
          No se encontraron recetas
        </p>
      </div>

      <div v-else class="space-y-4 p-4">
        <div
          v-for="recipe in store.filteredRecipes"
          :key="recipe.id"
          class="relative p-4 transition-all border rounded-lg cursor-pointer group bg-default/40 border-default"
          :class="[
            store.activeRecipeId === recipe.id
              ? 'bg-primary/5 border-primary'
              : 'hover:bg-primary/5 hover:border-primary/50'
          ]"
          @click="store.activeRecipeId = recipe.id"
        >
          <div class="flex justify-between items-start mb-1">
            <h3
              class="font-medium truncate pr-2 transition-colors"
              :class="store.activeRecipeId === recipe.id ? 'text-primary' : 'text-gray-900 dark:text-white'"
            >
              {{ recipe.name }}
            </h3>
            <div class="flex items-center gap-2">
              <UBadge :color="(categoryColors[recipe.category] as any) || 'neutral'" variant="subtle" size="xs">
                {{ recipe.category }}
              </UBadge>
              <UDropdownMenu :items="[
                { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => handleEditRecipe(recipe) },
                { label: 'Eliminar', icon: 'i-lucide-trash-2', onSelect: () => handleDeleteRecipe(recipe.id), color: 'error' }
              ]" :content="{ align: 'end' }">
                <UButton
                  icon="i-lucide-more-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </div>
          <p class="text-xs text-muted line-clamp-2 mb-2">
            {{ recipe.description }}
          </p>
          <div class="flex items-center text-xs text-muted">
            <UIcon name="i-lucide-scale" class="w-3 h-3 mr-1" />
            <span>Base: {{ recipe.baseYield }} {{ recipe.yieldUnit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para crear/editar recetas -->
  <UModal v-model:open="showFormModal" :title="isEditing ? 'Editar Receta' : 'Nueva Receta'" class="max-w-4xl">
    <template #body>
      <div class="space-y-6">
        <UTabs :items="[
          { label: 'Información Básica', value: 'basic', icon: 'i-lucide-info' },
          { label: 'Ingredientes', value: 'ingredients', icon: 'i-lucide-flask-conical' },
          { label: 'Preparación', value: 'steps', icon: 'i-lucide-chef-hat' }
        ]" v-model="activeTab" />
        
        <div v-if="activeTab === 'basic'" class="space-y-4 pt-4">
          <UFormField label="Nombre" required>
            <UInput v-model="formRecipe.name" placeholder="Nombre de la receta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="formRecipe.description" placeholder="Descripción breve" />
          </UFormField>
          <UFormField label="Categoría" required>
            <USelect v-model="formRecipe.category" :options="categoryOptions" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Rendimiento base" required>
              <UInput
                v-model.number="formRecipe.baseYield"
                type="number"
                step="0.01"
                placeholder="Ej: 10.5"
              />
            </UFormField>
            <UFormField label="Unidad" required>
              <UInput v-model="formRecipe.yieldUnit" placeholder="Ej: L, kg, g" />
            </UFormField>
          </div>
          <UFormField label="Instrucciones de almacenamiento">
            <UTextarea v-model="formRecipe.storageInstructions" placeholder="Condiciones de almacenamiento" />
          </UFormField>
        </div>
        
        <div v-if="activeTab === 'ingredients'" class="space-y-4 pt-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Ingredientes</h3>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              label="Agregar Ingrediente"
              @click="addIngredient"
            />
          </div>
          
          <div v-if="!formRecipe.ingredients || formRecipe.ingredients.length === 0" class="text-center py-8 text-muted border-2 border-dashed border-default rounded-lg">
            <UIcon name="i-lucide-flask-conical" class="w-12 h-12 mx-auto opacity-20 mb-2" />
            <p>No hay ingredientes aún</p>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="ghost"
              size="sm"
              label="Agregar primer ingrediente"
              @click="addIngredient"
              class="mt-2"
            />
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(ingredient, index) in formRecipe.ingredients"
              :key="index"
              class="p-4 border rounded-lg border-default bg-default/40 space-y-3"
            >
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
                      :disabled="index === 0"
                      @click="moveIngredientUp(index)"
                      title="Mover arriba"
                    />
                    <UButton
                      icon="i-lucide-arrow-down"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :padded="false"
                      :disabled="index === formRecipe.ingredients.length - 1"
                      @click="moveIngredientDown(index)"
                      title="Mover abajo"
                    />
                  </div>
                </div>
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click="removeIngredient(index)"
                  title="Eliminar"
                />
              </div>
              
              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-7">
                  <UFormField label="Nombre" required>
                    <UInput v-model="ingredient.name" placeholder="Ej: Azúcar refinada blanca" />
                  </UFormField>
                </div>
                <div class="col-span-3">
                  <UFormField label="Cantidad" required>
                    <UInput
                      v-model.number="ingredient.quantity"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 8"
                    />
                  </UFormField>
                </div>
                <div class="col-span-2">
                  <UFormField label="Unidad" required>
                    <UInput v-model="ingredient.unit" placeholder="Ej: kg" />
                  </UFormField>
                </div>
              </div>
              
              <UFormField label="Notas (opcional)">
                <UInput v-model="ingredient.notes" placeholder="Notas adicionales" />
              </UFormField>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'steps'" class="space-y-4 pt-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Pasos de Preparación</h3>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              label="Agregar Paso"
              @click="addStep"
            />
          </div>
          
          <div v-if="!formRecipe.steps || formRecipe.steps.length === 0" class="text-center py-8 text-muted border-2 border-dashed border-default rounded-lg">
            <UIcon name="i-lucide-chef-hat" class="w-12 h-12 mx-auto opacity-20 mb-2" />
            <p>No hay pasos de preparación aún</p>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="ghost"
              size="sm"
              label="Agregar primer paso"
              @click="addStep"
              class="mt-2"
            />
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="(step, index) in formRecipe.steps"
              :key="index"
              class="p-4 border rounded-lg border-default bg-default/40 space-y-3"
            >
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
                      :disabled="index === 0"
                      @click="moveStepUp(index)"
                      title="Mover arriba"
                    />
                    <UButton
                      icon="i-lucide-arrow-down"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :padded="false"
                      :disabled="index === formRecipe.steps.length - 1"
                      @click="moveStepDown(index)"
                      title="Mover abajo"
                    />
                  </div>
                </div>
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click="removeStep(index)"
                  title="Eliminar"
                />
              </div>
              
              <UFormField label="Descripción" required>
                <UTextarea
                  v-model="step.description"
                  placeholder="Describe este paso de la preparación..."
                  :rows="3"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-muted">
          <span v-if="activeTab === 'ingredients'">
            {{ formRecipe.ingredients?.length || 0 }} ingredientes
          </span>
          <span v-else-if="activeTab === 'steps'">
            {{ formRecipe.steps?.length || 0 }} pasos
          </span>
          <span v-else>
            Información básica
          </span>
        </div>
        <div class="flex gap-3">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="showFormModal = false"
          />
          <UButton :label="isEditing ? 'Actualizar' : 'Crear'" color="primary" @click="saveRecipe" />
        </div>
      </div>
    </template>
  </UModal>
</template>
