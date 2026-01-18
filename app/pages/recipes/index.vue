<script setup lang="ts">
import RecipeList from '~/components/recipes/RecipeList.vue'
import RecipeDetail from '~/components/recipes/RecipeDetail.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
  requiresAuth: true
})
</script>

<template>
  <UDashboardPanel id="recipes">
    <UDashboardNavbar title="Recetario">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-hidden h-full">
      <div class="flex h-full">
        <!-- Sidebar List -->
        <div class="w-80 lg:w-96 shrink-0 h-full overflow-hidden">
          <RecipeList />
        </div>

        <!-- Main Detail View -->
        <div class="flex-1 h-full overflow-hidden">
          <RecipeDetail />
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>
