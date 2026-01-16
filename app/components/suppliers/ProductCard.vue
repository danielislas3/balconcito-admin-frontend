<script setup lang="ts">
import type { SupplierProduct } from '~/types/suppliers'

const props = defineProps<{
  product: SupplierProduct
  isCheapest: boolean
  cheapestPrice?: number
}>()

const store = useSuppliersStore()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}
</script>

<template>
  <div
    class="relative p-4 transition-all border rounded-xl cursor-pointer group bg-gray-800/40 border-gray-700/50 hover:bg-primary-500/5 hover:border-primary-500/50"
    @click="store.addToCart(product)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold tracking-wider text-primary-500">{{ product.codigo }}</span>
          <UBadge
            v-if="isCheapest"
            color="success"
            variant="subtle"
            size="xs"
            class="font-bold"
          >
            💰 MÁS BARATO
          </UBadge>
        </div>
        
        <h3 class="font-medium text-gray-200 truncate pr-2" :title="product.descripcion">
          {{ product.descripcion }}
        </h3>
        
        <div class="mt-1 text-sm text-gray-500">
          {{ product.marca }} • {{ product.empaque }}
        </div>
        
        <div v-if="!isCheapest && cheapestPrice" class="mt-2 text-xs font-medium text-amber-500">
          +{{ formatPrice(product.precioMayoreo - cheapestPrice) }} vs opción más barata
        </div>
      </div>

      <div class="flex flex-col items-end shrink-0">
        <span class="text-xl font-bold text-teal-400 tabular-nums">
          {{ formatPrice(product.precioMayoreo) }}
        </span>
        <span class="text-xs text-gray-600">Mayoreo</span>
      </div>
    </div>
  </div>
</template>
