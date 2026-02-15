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
    class="relative p-4 transition-all border rounded-lg cursor-pointer group bg-default/40 border-default hover:bg-primary/5 hover:border-primary/50"
    @click="store.addToCart(product)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold tracking-wider text-primary">{{ product.codigo }}</span>
          <UBadge
            v-if="isCheapest"
            color="success"
            variant="subtle"
            size="xs"
            class="font-bold"
          >
            <UIcon name="i-lucide-badge-dollar-sign" class="size-3 mr-1" />
            MÁS BARATO
          </UBadge>
        </div>

        <h3 class="font-medium truncate pr-2" :title="product.descripcion">
          {{ product.descripcion }}
        </h3>

        <div class="mt-1 text-sm text-muted">
          {{ product.marca }} • {{ product.empaque }}
        </div>

        <div v-if="!isCheapest && cheapestPrice" class="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          +{{ formatPrice(product.precioPublico - cheapestPrice) }} vs opción más barata
        </div>
      </div>

      <div class="flex flex-col items-end shrink-0">
        <span class="text-xl font-bold text-primary tabular-nums">
          {{ formatPrice(product.precioPublico) }}
        </span>
        <span class="text-xs text-muted">Público</span>
      </div>
    </div>
  </div>
</template>
