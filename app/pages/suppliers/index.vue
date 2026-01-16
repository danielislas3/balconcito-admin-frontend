<script setup lang="ts">
import SupplierUpload from '~/components/suppliers/SupplierUpload.vue'
import ProductCard from '~/components/suppliers/ProductCard.vue'
import OrderCart from '~/components/suppliers/OrderCart.vue'

definePageMeta({
  layout: 'default'
})

const store = useSuppliersStore()
</script>

<template>
  <UDashboardPanel id="suppliers" :loading="store.isLoading">
    <UDashboardNavbar title="Proveedores">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 p-4 overflow-hidden">
      <!-- Upload View -->
      <div v-if="!store.isLoading" class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
        <div class="w-full">
          <SupplierUpload />
        </div>
      </div>

      <!-- Dashboard View -->
      <div v-else class="h-full">
        <div class="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left Panel: Search & Products -->
          <div class="flex flex-col h-full lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <span>🔍</span> Buscar Productos
              </h2>
              <div class="flex items-center gap-3">
                <UBadge color="primary" variant="subtle">
                  {{ store.fileName }}
                </UBadge>
                <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-x" label="Cargar otro archivo"
                  @click="store.clear" />
              </div>
            </div>

            <div class="relative mb-4">
              <UInput v-model="store.searchTerm" icon="i-lucide-search"
                placeholder="Busca por nombre, código o marca... (ej: ala, manteca, tyson)" size="xl" autofocus>
                <template #trailing>
                  <div class="flex items-center gap-1 text-xs text-gray-500">
                    <span class="px-1.5 py-0.5 border border-gray-700 rounded">ESC</span> para limpiar
                  </div>
                </template>
              </UInput>
            </div>

            <div class="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
              <div v-if="store.filteredProducts.length === 0 && store.searchTerm.length > 1"
                class="text-center py-12 text-gray-500">
                No se encontraron productos para "{{ store.searchTerm }}"
              </div>

              <div v-else-if="store.searchTerm.length <= 1" class="text-center py-12 text-gray-500">
                Escribe al menos 2 caracteres para buscar
              </div>

              <div v-else class="space-y-3">
                <ProductCard v-for="(product, idx) in store.filteredProducts" :key="product.codigo" :product="product"
                  :is-cheapest="idx === 0" :cheapest-price="store.filteredProducts[0]?.precioMayoreo" />
              </div>
            </div>
          </div>

          <!-- Right Panel: Cart -->
          <div class="h-full min-h-0">
            <OrderCart />
          </div>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>
