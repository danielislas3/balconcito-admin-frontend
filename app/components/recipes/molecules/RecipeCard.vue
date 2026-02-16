<script setup lang="ts">
import type { Recipe } from '~/types/recipes'

interface Props {
  recipe: Recipe
  isActive?: boolean
  categoryColors: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [recipe: Recipe]
  edit: [recipe: Recipe]
  delete: [id: number]
}>()

const handleClick = () => {
  emit('click', props.recipe)
}

const handleEdit = () => {
  emit('edit', props.recipe)
}

const handleDelete = () => {
  emit('delete', props.recipe.id)
}
</script>

<template>
  <div
    class="relative p-4 transition-all border rounded-lg cursor-pointer group bg-default/40 border-default"
    :class="[
      isActive
        ? 'bg-primary/5 border-primary'
        : 'hover:bg-primary/5 hover:border-primary/50'
    ]"
    @click="handleClick"
  >
    <div class="flex justify-between items-start mb-1">
      <h3
        class="font-medium truncate pr-2 transition-colors"
        :class="isActive ? 'text-primary' : 'text-gray-900 dark:text-white'"
      >
        {{ recipe.name }}
      </h3>
      <div class="flex items-center gap-2">
        <UBadge :color="(categoryColors[recipe.category] as any) || 'neutral'" variant="subtle" size="xs">
          {{ recipe.category }}
        </UBadge>
        <UDropdownMenu
          :items="[
            { label: 'Editar', icon: 'i-lucide-pencil', onSelect: handleEdit },
            { label: 'Eliminar', icon: 'i-lucide-trash-2', onSelect: handleDelete, color: 'error' }
          ]"
          :content="{ align: 'end' }"
        >
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
</template>
