<script setup lang="ts">
const store = useSuppliersStore()
const toast = useToast()

const dragOver = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFile = async (file: File) => {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    toast.add({
      title: 'Formato inválido',
      description: 'Por favor sube un archivo Excel (.xlsx o .xls)',
      color: 'error'
    })
    return
  }

  uploading.value = true
  try {
    const result = await store.uploadPriceList(file)

    const supplierName = `APYS - ${result.month} ${result.year}`
    toast.add({
      title: result.replaced ? 'Lista reemplazada' : 'Lista de precios cargada',
      description: `${supplierName} - ${result.totalProducts} productos`,
      color: 'success'
    })
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error al procesar',
      description: 'No se pudo procesar el archivo. Verifica el formato.',
      color: 'error'
    })
  } finally {
    uploading.value = false
  }
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer?.files[0]) {
    handleFile(e.dataTransfer.files[0])
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    handleFile(target.files[0])
  }
}
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center p-12 transition-all border-2 border-dashed rounded-xl cursor-pointer"
    :class="[
      dragOver ? 'border-primary bg-primary/10' : 'border-default hover:border-primary/50 bg-default/50'
    ]"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop="onDrop"
    @click="fileInput?.click()"
  >
    <div v-if="uploading" class="flex flex-col items-center gap-4">
      <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary" />
      <p class="text-lg font-medium text-muted">
        Procesando archivo...
      </p>
    </div>

    <div v-else class="flex flex-col items-center gap-4 text-center">
      <div class="p-4 rounded-full bg-stone-100 dark:bg-stone-800">
        <UIcon name="i-lucide-upload-cloud" class="w-10 h-10 text-primary" />
      </div>
      <div>
        <h3 class="text-xl font-semibold">
          Cargar lista de precios
        </h3>
        <p class="mt-2 text-muted">
          Arrastra tu archivo Excel aquí o haz clic para buscarlo
        </p>
      </div>
      <p class="text-sm text-muted">
        Soporta .xlsx y .xls
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="onFileChange"
    >
  </div>
</template>
