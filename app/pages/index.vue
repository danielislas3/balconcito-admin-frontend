<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
})
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-highlighted">
            Balconcito ERP
          </h2>
          <p class="text-muted">
            Sistema de administraci&oacute;n centralizado
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <UButton
            to="/payroll"
            icon="i-lucide-calculator"
            label="N&oacute;minas"
            size="xl"
            variant="soft"
            block
            class="justify-center"
          />
          <UButton
            to="/suppliers"
            icon="i-lucide-truck"
            label="Proveedores"
            size="xl"
            variant="soft"
            block
            class="justify-center"
          />
          <UButton
            to="/recipes"
            icon="i-lucide-book-open"
            label="Recetas"
            size="xl"
            variant="soft"
            block
            class="justify-center"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
