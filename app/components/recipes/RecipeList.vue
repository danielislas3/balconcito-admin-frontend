<script setup lang="ts">
import type { Recipe, RecipeCategory } from '~/types/recipes'
import RecipeCard from '~/components/recipes/molecules/RecipeCard.vue'
import RecipeFormModal from '~/components/recipes/organisms/RecipeFormModal.vue'

const store = useRecipesStore()
const toast = useToast()

const showFormModal = ref(false)
const formRecipe = ref<Partial<Recipe>>({})
const isEditing = ref(false)

const categoryColors: Record<string, string> = {
  Salsas: 'red',
  Jarabes: 'amber',
  Sazonadores: 'orange',
  Bebidas: 'blue',
  Preparados: 'emerald'
}

const handleCreateRecipe = () => {
  isEditing.value = false
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
  formRecipe.value = { ...recipe }
  showFormModal.value = true
}

const saveRecipe = (recipeData: Partial<Recipe>) => {
  if (!recipeData.name || !recipeData.category || !recipeData.baseYield || !recipeData.yieldUnit) {
    toast.add({ title: 'Error', description: 'Completa los campos requeridos', color: 'error' })
    return
  }

  const recipe: Recipe = {
    id: recipeData.id || generateId(recipeData.name),
    name: recipeData.name,
    description: recipeData.description || '',
    category: recipeData.category as RecipeCategory,
    baseYield: recipeData.baseYield,
    yieldUnit: recipeData.yieldUnit,
    ingredients: recipeData.ingredients || [],
    steps: recipeData.steps || [],
    storageInstructions: recipeData.storageInstructions || '',
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
        <RecipeCard
          v-for="recipe in store.filteredRecipes"
          :key="recipe.id"
          :recipe="recipe"
          :is-active="store.activeRecipeId === recipe.id"
          :category-colors="categoryColors"
          @click="store.activeRecipeId = recipe.id"
          @edit="handleEditRecipe"
          @delete="handleDeleteRecipe"
        />
      </div>
    </div>
  </div>

  <RecipeFormModal
    v-model:open="showFormModal"
    :recipe="formRecipe"
    :is-editing="isEditing"
    @save="saveRecipe"
    @cancel="showFormModal = false"
  />
</template>
