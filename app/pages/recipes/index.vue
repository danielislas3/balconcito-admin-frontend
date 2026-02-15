<script setup lang="ts">
import RecipeList from '~/components/recipes/RecipeList.vue'
import RecipeDetail from '~/components/recipes/RecipeDetail.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
  requiresAuth: true
})

const store = useRecipesStore()
</script>

<template>
  <UDashboardPanel id="recipes" :ui="{ body: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Recetario">
        <template #leading>
          <!-- Mobile: back button when detail is open -->
          <UButton
            v-if="store.activeRecipeId"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            class="lg:hidden"
            @click="store.activeRecipeId = null"
          />
          <!-- Sidebar collapse: always on desktop, hidden on mobile when detail is open -->
          <UDashboardSidebarCollapse :class="{ 'hidden lg:flex': store.activeRecipeId }" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full">
        <!-- Recipe List: full-width on mobile, sidebar on desktop. Hidden on mobile when detail is open -->
        <div
          :class="[
            'h-full overflow-hidden shrink-0 border-r border-default',
            'w-full lg:w-80',
            store.activeRecipeId ? 'hidden lg:block' : ''
          ]"
        >
          <RecipeList />
        </div>

        <!-- Recipe Detail: hidden on mobile when no recipe selected -->
        <div
          :class="[
            'flex-1 h-full overflow-hidden',
            store.activeRecipeId ? '' : 'hidden lg:block'
          ]"
        >
          <RecipeDetail />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
