<script setup lang="ts">
const store = useSuppliersStore()

const priceChanges = computed(() => store.getPriceComparison())
const showAll = ref(false)

const displayedChanges = computed(() => {
  return showAll.value ? priceChanges.value : priceChanges.value.slice(0, 10)
})

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}

const formatPercentage = (value: number) => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
</script>

<template>
  <UCard v-if="store.hasMultipleLists">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-trending-up" class="size-5 text-primary" />
          <h3 class="text-lg font-semibold">
            Comparación de Precios
          </h3>
        </div>
        <UBadge color="primary" variant="subtle">
          {{ priceChanges.length }} cambios
        </UBadge>
      </div>
      <p class="text-sm text-muted mt-1">
        Comparando con lista anterior
      </p>
    </template>

    <div v-if="priceChanges.length === 0" class="text-center py-8 text-muted">
      <p>No hay cambios de precio entre estas listas</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="change in displayedChanges"
        :key="change.codigo"
        class="flex items-center justify-between p-3 rounded-lg bg-default/40 border border-default"
      >
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-primary">
            {{ change.codigo }}
          </div>
          <div class="text-sm font-medium truncate" :title="change.descripcion">
            {{ change.descripcion }}
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <div class="text-sm text-muted line-through">
              {{ formatPrice(change.previousPrice) }}
            </div>
            <div class="text-base font-bold text-primary tabular-nums">
              {{ formatPrice(change.currentPrice) }}
            </div>
          </div>

          <UBadge
            :color="change.difference > 0 ? 'error' : 'success'"
            variant="subtle"
            class="font-bold min-w-[70px] justify-center"
          >
            {{ formatPercentage(change.percentageChange) }}
          </UBadge>
        </div>
      </div>

      <UButton
        v-if="priceChanges.length > 10"
        block
        variant="ghost"
        color="neutral"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Ver menos' : `Ver todos (${priceChanges.length})` }}
      </UButton>
    </div>
  </UCard>
</template>
