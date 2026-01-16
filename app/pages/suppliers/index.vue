<script setup lang="ts">
import SupplierUpload from '~/components/suppliers/SupplierUpload.vue'
import ProductCard from '~/components/suppliers/ProductCard.vue'
import OrderCart from '~/components/suppliers/OrderCart.vue'
import PriceListManager from '~/components/suppliers/PriceListManager.vue'
import PriceComparison from '~/components/suppliers/PriceComparison.vue'

definePageMeta({
  layout: 'default'
})

const store = useSuppliersStore()

// Keyboard shortcut to clear search
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && store.searchTerm) {
    store.searchTerm = ''
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
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
      <div v-if="!store.isLoading" class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto gap-6">
        <div class="w-full">
          <SupplierUpload />
        </div>

        <!-- Show existing price lists if any -->
        <div v-if="store.priceLists.length > 0" class="w-full">
          <PriceListManager />
        </div>
      </div>

      <!-- Dashboard View -->
      <div v-else class="h-full">
        <div class="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left Panel: Search & Products -->
          <div class="flex flex-col h-full lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <UIcon name="i-lucide-search" class="size-5 text-primary" />
                Buscar Productos
              </h2>
              <div class="flex items-center gap-3">
                <UBadge color="primary" variant="subtle" v-if="store.currentPriceList">
                  {{ store.currentPriceList.supplierType === 'apys'
                    ? `APYS - ${store.currentPriceList.month} ${store.currentPriceList.year}`
                    : store.currentPriceList.fileName }}
                </UBadge>
                <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-list" label="Ver listas"
                  @click="store.isLoading = false" />
              </div>
            </div>

            <div class="relative mb-4">
              <UInput v-model="store.searchTerm" icon="i-lucide-search"
                placeholder="Busca por código, nombre o marca..." size="xl" autofocus>
                <template #trailing>
                  <div v-if="store.searchTerm" class="flex items-center gap-1 text-xs text-muted">
                    <span class="px-1.5 py-0.5 border border-default rounded">ESC</span> para limpiar
                  </div>
                </template>
              </UInput>
            </div>

            <div class="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
              <!-- Mensaje solo cuando hay 1 carácter -->
              <div v-if="store.searchTerm.length === 1" class="text-center py-12 text-muted">
                <p class="text-sm">Escribe al menos 2 caracteres para buscar</p>
              </div>

              <!-- Sin resultados después de buscar -->
              <div v-else-if="store.filteredProducts.length === 0 && store.searchTerm.length >= 2"
                class="text-center py-12 text-muted">
                <p>No se encontraron productos para "{{ store.searchTerm }}"</p>
                <p class="text-sm mt-2">Intenta con otro término de búsqueda</p>
              </div>

              <!-- Mostrar productos -->
              <div v-else class="space-y-3">
                <div v-if="store.searchTerm.length === 0" class="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p class="text-sm text-muted">
                    <UIcon name="i-lucide-info" class="size-4 inline mr-1" />
                    Mostrando los 50 productos más económicos. Usa el buscador para encontrar productos específicos.
                  </p>
                </div>
                <ProductCard v-for="(product, idx) in store.filteredProducts" :key="product.codigo" :product="product"
                  :is-cheapest="idx === 0" :cheapest-price="store.filteredProducts[0]?.precioMayoreo" />
              </div>
            </div>
          </div>

          <!-- Right Panel: Cart & Tools -->
          <div class="flex flex-col h-full min-h-0 gap-4">
            <div class="flex-1 min-h-0">
              <OrderCart />
            </div>

            <!-- Price Comparison (only if multiple lists exist) -->
            <div v-if="store.hasMultipleLists" class="shrink-0">
              <PriceComparison />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>
