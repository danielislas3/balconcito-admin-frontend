<script setup lang="ts">
import type { Recipe, RecipeCategory } from '~/types/recipes'
import type { Ref } from 'vue'

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

const categoryOptions = ['Salsas', 'Jarabes', 'Sazonadores', 'Bebidas', 'Preparados'].map(c => ({ value: c, label: c }))

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

const saveRecipe = () => {
  if (!formRecipe.value.name || !formRecipe.value.category || !formRecipe.value.baseYield || !formRecipe.value.yieldUnit) {
    toast.add({ title: 'Error', description: 'Completa los campos requeridos', color: 'error' })
    return
  }

  const recipe: Recipe = {
    id: formRecipe.value.id || generateId(formRecipe.value.name),
    name: formRecipe.value.name,
    description: formRecipe.value.description || '',
    category: formRecipe.value.category as RecipeCategory,
    baseYield: formRecipe.value.baseYield,
    yieldUnit: formRecipe.value.yieldUnit,
    ingredients: formRecipe.value.ingredients || [],
    steps: formRecipe.value.steps || [],
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
  <UModal v-model:open="showFormModal" :title="isEditing ? 'Editar Receta' : 'Nueva Receta'">
    <template #body>
      <div class="space-y-4">
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
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="showFormModal = false"
        />
        <UButton :label="isEditing ? 'Actualizar' : 'Crear'" color="primary" @click="saveRecipe" />
      </div>
    </template>
  </UModal>
</template>
