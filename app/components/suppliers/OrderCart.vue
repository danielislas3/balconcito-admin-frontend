<script setup lang="ts">
const store = useSuppliersStore()

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-900/50 border border-gray-800 rounded-xl">
    <div class="p-4 border-b border-gray-800  shrink-0">
      <h2 class="text-lg font-semibold flex items-center gap-2">
        <span>📋</span> Mi Pedido ({{ store.cart.length }})
      </h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
      <div v-if="store.cart.length === 0" class="text-center py-12 text-gray-500">
        <p>Tu pedido está vacío</p>
        <p class="text-sm mt-2">Busca productos y haz clic para agregarlos</p>
      </div>

      <div v-for="item in store.cart" :key="item.codigo"
        class="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-primary-500">{{ item.codigo }}</div>
          <div class="text-sm font-medium truncate mb-1" :title="item.descripcion">
            {{ item.descripcion }}
          </div>
          <div class="text-sm font-bold text-teal-400">
            {{ formatPrice(item.precioMayoreo * item.cantidad) }}
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-1">
            <button
              class="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              @click="store.updateQuantity(item.codigo, item.cantidad - 1)">
              -
            </button>
            <input type="number" v-model.number="item.cantidad" min="1"
              class="w-12 h-7 text-center bg-gray-900 border border-gray-700 rounded text-sm"
              @change="store.updateQuantity(item.codigo, item.cantidad)">
            <button
              class="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              @click="store.updateQuantity(item.codigo, item.cantidad + 1)">
              +
            </button>
          </div>

          <button class="p-1 text-gray-400 hover:text-red-500 transition-colors"
            @click="store.removeFromCart(item.codigo)" title="Eliminar">
            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.cart.length > 0" class="p-4 border-t border-gray-800 bg-gray-900/80 shrink-0">
      <div class="flex justify-between items-center mb-4">
        <span class="text-lg font-medium">Total:</span>
        <span class="text-2xl font-bold text-primary-500 tabular-nums">
          {{ formatPrice(store.cartTotal) }}
        </span>
      </div>

      <UButton block size="lg" color="primary" icon="i-lucide-download" label="Descargar Pedido XLSX"
        @click="store.downloadOrder" />
    </div>
  </div>
</template>
