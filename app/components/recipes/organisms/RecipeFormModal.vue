<script setup lang="ts">
import type { Recipe, StorageInstructions } from '~/types/recipes'
import RecipeIngredientList from '~/components/recipes/molecules/RecipeIngredientList.vue'
import RecipeStepList from '~/components/recipes/molecules/RecipeStepList.vue'

export interface RecipeFormModalProps {
  open: boolean
  recipe: Partial<Recipe>
  isEditing?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<RecipeFormModalProps>(), {
  isEditing: false,
  loading: false
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'save': [recipe: Partial<Recipe>]
  'cancel': []
}>()

const toast = useToast()
const activeTab = ref('basic')

const categoryOptions = ['Salsas', 'Jarabes', 'Sazonadores', 'Bebidas', 'Preparados'].map(c => ({ value: c, label: c }))

const localRecipe = ref<Partial<Recipe>>({ ...props.recipe })
const storageFields = ref<StorageInstructions>({})

// Reset local recipe when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localRecipe.value = { ...props.recipe }
    storageFields.value = { ...(props.recipe.storageInstructions || {}) }
  }
})

const closeModal = () => {
  emit('update:open', false)
  emit('cancel')
}

const handleSave = () => {
  if (!localRecipe.value.name || !localRecipe.value.category || !localRecipe.value.baseYield || !localRecipe.value.yieldUnit) {
    toast.add({ title: 'Error', description: 'Completa los campos requeridos', color: 'error' })
    return
  }

  // Filter empty ingredients and validate
  const ingredients = (localRecipe.value.ingredients || [])
    .filter(ing => ing.name?.trim() && ing.quantity > 0 && ing.unit?.trim())
    .map(ing => ({
      ...ing,
      name: ing.name.trim(),
      unit: ing.unit.trim(),
      notes: ing.notes?.trim() || undefined
    }))

  // Filter empty steps and validate
  const steps = (localRecipe.value.steps || [])
    .filter(step => step.description?.trim())
    .map((step, index) => ({
      description: step.description.trim(),
      order: index + 1
    }))

  // Show warnings if there is incomplete data
  const totalIngredients = localRecipe.value.ingredients?.length || 0
  const totalSteps = localRecipe.value.steps?.length || 0
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

  // Build storageInstructions only if at least one field has content
  const si = storageFields.value
  const hasStorage = si.temperatura?.trim() || si.vidaUtil?.trim() || si.condiciones?.trim() || si.notas?.trim()
  const storageInstructions: StorageInstructions | undefined = hasStorage
    ? {
        ...(si.temperatura?.trim() ? { temperatura: si.temperatura.trim() } : {}),
        ...(si.vidaUtil?.trim() ? { vidaUtil: si.vidaUtil.trim() } : {}),
        ...(si.condiciones?.trim() ? { condiciones: si.condiciones.trim() } : {}),
        ...(si.notas?.trim() ? { notas: si.notas.trim() } : {})
      }
    : undefined

  emit('save', {
    ...localRecipe.value,
    ingredients,
    steps,
    storageInstructions
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="isEditing ? 'Editar Receta' : 'Nueva Receta'"
    class="max-w-4xl"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <UTabs
          v-model="activeTab"
          :items="[
            { label: 'Información Básica', value: 'basic', icon: 'i-lucide-info' },
            { label: 'Ingredientes', value: 'ingredients', icon: 'i-lucide-flask-conical' },
            { label: 'Preparación', value: 'steps', icon: 'i-lucide-chef-hat' }
          ]"
        />

        <div v-if="activeTab === 'basic'" class="space-y-4 pt-4">
          <UFormField label="Nombre" required>
            <UInput v-model="localRecipe.name" placeholder="Nombre de la receta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="localRecipe.description" placeholder="Descripción breve" />
          </UFormField>
          <UFormField label="Categoría" required>
            <USelect v-model="localRecipe.category" :options="categoryOptions" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Rendimiento base" required>
              <UInput
                v-model.number="localRecipe.baseYield"
                type="number"
                step="0.01"
                placeholder="Ej: 10.5"
              />
            </UFormField>
            <UFormField label="Unidad" required>
              <UInput v-model="localRecipe.yieldUnit" placeholder="Ej: L, kg, g" />
            </UFormField>
          </div>

          <div class="border border-default rounded-lg p-4 space-y-3">
            <h4 class="text-sm font-medium flex items-center gap-2">
              <UIcon name="i-lucide-snowflake" class="w-4 h-4 text-info" />
              Instrucciones de almacenamiento
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Temperatura">
                <UInput v-model="storageFields.temperatura" placeholder="Ej: Refrigerar siempre" />
              </UFormField>
              <UFormField label="Vida útil">
                <UInput v-model="storageFields.vidaUtil" placeholder="Ej: 30 días" />
              </UFormField>
            </div>
            <UFormField label="Condiciones">
              <UInput v-model="storageFields.condiciones" placeholder="Ej: Recipiente hermético, lugar fresco" />
            </UFormField>
            <UFormField label="Notas adicionales">
              <UInput v-model="storageFields.notas" placeholder="Ej: Agitar antes de usar" />
            </UFormField>
          </div>
        </div>

        <div v-if="activeTab === 'ingredients'" class="space-y-4 pt-4">
          <RecipeIngredientList
            v-model:ingredients="localRecipe.ingredients"
          />
        </div>

        <div v-if="activeTab === 'steps'" class="space-y-4 pt-4">
          <RecipeStepList
            v-model:steps="localRecipe.steps"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-muted">
          <span v-if="activeTab === 'ingredients'">
            {{ localRecipe.ingredients?.length || 0 }} ingredientes
          </span>
          <span v-else-if="activeTab === 'steps'">
            {{ localRecipe.steps?.length || 0 }} pasos
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
            @click="closeModal"
          />
          <UButton
            :label="isEditing ? 'Actualizar' : 'Crear'"
            color="primary"
            :loading="loading"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
