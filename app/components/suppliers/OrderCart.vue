<script setup lang="ts">
const store = useSuppliersStore()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}

const weekNumber = computed(() => {
  const now = new Date()
  return store.getWeekNumber(now)
})

const isApys = computed(() => store.currentPriceList?.supplierType === 'apys')
</script>

<template>
  <div class="flex flex-col h-full bg-default/50 border border-default rounded-xl">
    <div class="p-4 border-b border-default shrink-0">
      <h2 class="text-lg font-semibold flex items-center gap-2">
        <UIcon name="i-lucide-shopping-cart" class="size-5 text-primary" />
        Mi Pedido ({{ store.cart.length }})
      </h2>
      <p v-if="isApys" class="text-sm text-muted mt-1">
        Semana {{ weekNumber }} • {{ store.currentPriceList?.month }} {{ store.currentPriceList?.year }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
      <div v-if="store.cart.length === 0" class="text-center py-12 text-muted">
        <p>Tu pedido está vacío</p>
        <p class="text-sm mt-2">
          Busca productos y haz clic para agregarlos
        </p>
      </div>

      <div
        v-for="item in store.cart"
        :key="item.codigo"
        class="flex items-center gap-3 p-3 bg-default/40 rounded-lg border border-default"
      >
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-primary">
            {{ item.codigo }}
          </div>
          <div class="text-sm font-medium truncate mb-1" :title="item.descripcion">
            {{ item.descripcion }}
          </div>
          <div class="text-sm font-bold text-primary tabular-nums">
            {{ formatPrice(item.precioMayoreo * item.cantidad) }}
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-1">
            <button
              class="w-7 h-7 flex items-center justify-center rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              @click="store.updateQuantity(item.codigo, item.cantidad - 1)"
            >
              -
            </button>
            <input
              v-model.number="item.cantidad"
              type="number"
              min="1"
              class="w-12 h-7 text-center bg-default border border-default rounded text-sm"
              @change="store.updateQuantity(item.codigo, item.cantidad)"
            >
            <button
              class="w-7 h-7 flex items-center justify-center rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              @click="store.updateQuantity(item.codigo, item.cantidad + 1)"
            >
              +
            </button>
          </div>

          <button
            class="p-1 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
            @click="store.removeFromCart(item.codigo)"
          >
            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.cart.length > 0" class="p-4 border-t border-default bg-default/80 shrink-0">
      <div class="flex justify-between items-center mb-4">
        <span class="text-lg font-medium">Total:</span>
        <span class="text-2xl font-bold text-primary tabular-nums">
          {{ formatPrice(store.cartTotal) }}
        </span>
      </div>

      <div v-if="isApys" class="text-xs text-muted mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
        <UIcon name="i-lucide-info" class="size-3 inline mr-1" />
        Recuerda: Pedidos deben enviarse antes del jueves a las 2pm
      </div>

      <UButton
        block
        size="lg"
        color="primary"
        icon="i-lucide-download"
        label="Descargar Pedido XLSX"
        @click="store.downloadOrder"
      />
    </div>
  </div>
</template>
