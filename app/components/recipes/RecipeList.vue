<script setup lang="ts">
import type { Recipe, RecipeCategory, StorageInstructions } from '~/types/recipes'
import RecipeCard from '~/components/recipes/molecules/RecipeCard.vue'
import RecipeFormModal from '~/components/recipes/organisms/RecipeFormModal.vue'

const store = useRecipesStore()
const toast = useToast()

const showFormModal = ref(false)
const formRecipe = ref<Partial<Recipe>>({})
const isEditing = ref(false)
const saving = ref(false)

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
    storageInstructions: undefined
  }
  showFormModal.value = true
}

const handleEditRecipe = (recipe: Recipe) => {
  isEditing.value = true
  formRecipe.value = { ...recipe }
  showFormModal.value = true
}

const saveRecipe = async (recipeData: Partial<Recipe>) => {
  if (!recipeData.name || !recipeData.category || !recipeData.baseYield || !recipeData.yieldUnit) {
    toast.add({ title: 'Error', description: 'Completa los campos requeridos', color: 'error' })
    return
  }

  saving.value = true
  try {
    const payload = {
      name: recipeData.name,
      description: recipeData.description || '',
      category: recipeData.category as RecipeCategory,
      baseYield: recipeData.baseYield,
      yieldUnit: recipeData.yieldUnit,
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      storageInstructions: recipeData.storageInstructions as StorageInstructions | undefined
    }

    if (isEditing.value && recipeData.id) {
      await store.updateRecipe(recipeData.id, payload)
      toast.add({
        title: 'Receta actualizada',
        description: `${recipeData.name} ha sido actualizada`,
        color: 'success'
      })
    } else {
      await store.addRecipe(payload as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>)
      toast.add({
        title: 'Receta creada',
        description: `${recipeData.name} ha sido creada`,
        color: 'success'
      })
    }

    showFormModal.value = false
    formRecipe.value = {}
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo guardar la receta', color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleDeleteRecipe = async (id: number) => {
  const recipe = store.recipes.find((r: Recipe) => r.id === id)
  if (recipe && confirm(`¿Seguro que quieres eliminar "${recipe.name}"?`)) {
    try {
      await store.deleteRecipe(id)
      toast.add({
        title: 'Receta eliminada',
        description: `${recipe.name} ha sido eliminada`,
        color: 'warning'
      })
    } catch {
      toast.add({ title: 'Error', description: 'No se pudo eliminar la receta', color: 'error' })
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-default">
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
      <div v-if="store.loading && store.recipes.length === 0" class="p-8 text-center text-muted">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 mx-auto mb-2 animate-spin" />
        <p class="text-sm">
          Cargando recetas...
        </p>
      </div>

      <div v-else-if="store.filteredRecipes.length === 0" class="p-8 text-center text-muted">
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
    :loading="saving"
    @save="saveRecipe"
    @cancel="showFormModal = false"
  />
</template>
