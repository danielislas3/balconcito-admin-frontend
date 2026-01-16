<script setup lang="ts">
const store = useSuppliersStore()
const toast = useToast()

const deletePriceList = (id: string) => {
  if (confirm('¿Estás seguro de eliminar esta lista de precios?')) {
    store.deletePriceList(id)
    toast.add({
      title: 'Lista eliminada',
      description: 'La lista de precios ha sido eliminada',
      color: 'success'
    })
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getListTitle = (list: any) => {
  if (list.supplierType === 'apys') {
    return `APYS - ${list.month} ${list.year}`
  }
  return list.fileName
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-list" class="size-5 text-primary" />
        <h3 class="text-lg font-semibold">Listas de Precios</h3>
        <UBadge color="primary" variant="subtle">{{ store.priceLists.length }}</UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <div v-if="store.priceLists.length === 0" class="text-center py-8 text-muted">
        <p>No hay listas de precios cargadas</p>
      </div>

      <div v-for="list in store.priceLists" :key="list.id"
        class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
        :class="[
          list.id === store.currentPriceListId
            ? 'border-primary bg-primary/5'
            : 'border-default bg-default/40 hover:border-primary/50'
        ]"
        @click="store.setCurrentPriceList(list.id)">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold">{{ getListTitle(list) }}</span>
            <UBadge
              v-if="list.id === store.currentPriceListId"
              color="success"
              variant="subtle"
              size="xs">
              ACTIVA
            </UBadge>
            <UBadge
              v-if="list.supplierType === 'apys'"
              color="primary"
              variant="subtle"
              size="xs">
              APYS
            </UBadge>
          </div>
          <div class="text-sm text-muted">
            {{ list.totalProducts }} productos • {{ formatDate(list.uploadDate) }}
          </div>
        </div>

        <button
          class="p-2 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
          @click.stop="deletePriceList(list.id)"
          title="Eliminar lista">
          <UIcon name="i-lucide-trash-2" class="size-4" />
        </button>
      </div>
    </div>
  </UCard>
</template>
