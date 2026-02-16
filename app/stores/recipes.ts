import { defineStore } from 'pinia'
import type { Recipe, Ingredient } from '~/types/recipes'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const activeRecipeId = ref<number | null>(null)
  const searchQuery = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeRecipe = computed(() => recipes.value.find(r => r.id === activeRecipeId.value))

  const filteredRecipes = computed(() => {
    if (!searchQuery.value) return recipes.value
    const term = searchQuery.value.toLowerCase()
    return recipes.value.filter(r =>
      r.name.toLowerCase().includes(term)
      || r.category.toLowerCase().includes(term)
    )
  })

  // Actions
  const fetchRecipes = async () => {
    loading.value = true
    error.value = null
    try {
      recipes.value = await $fetch<Recipe[]>('/api/recipes')
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar recetas'
      console.error('Error fetching recipes:', err)
    } finally {
      loading.value = false
    }
  }

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null
    try {
      const created = await $fetch<Recipe>('/api/recipes', {
        method: 'POST',
        body: recipe
      })
      recipes.value.push(created)
      return created
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al crear receta'
      console.error('Error creating recipe:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRecipe = async (id: number, recipe: Partial<Recipe>) => {
    loading.value = true
    error.value = null
    try {
      const updated = await $fetch<Recipe>(`/api/recipes/${id}`, {
        method: 'PATCH',
        body: recipe
      })
      const index = recipes.value.findIndex(r => r.id === id)
      if (index !== -1) recipes.value[index] = updated
      return updated
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar receta'
      console.error('Error updating recipe:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRecipe = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      recipes.value = recipes.value.filter(r => r.id !== id)
      if (activeRecipeId.value === id) activeRecipeId.value = null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar receta'
      console.error('Error deleting recipe:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const scaleIngredients = (recipeId: number, targetYield: number): Ingredient[] => {
    const recipe = recipes.value.find(r => r.id === recipeId)
    if (!recipe) return []

    const factor = targetYield / recipe.baseYield

    return recipe.ingredients.map(ing => ({
      ...ing,
      quantity: Number((ing.quantity * factor).toFixed(2))
    }))
  }

  return {
    recipes,
    activeRecipeId,
    searchQuery,
    loading,
    error,
    activeRecipe,
    filteredRecipes,
    fetchRecipes,
    scaleIngredients,
    addRecipe,
    updateRecipe,
    deleteRecipe
  }
})
