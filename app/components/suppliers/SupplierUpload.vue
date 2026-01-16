<script setup lang="ts">
const store = useSuppliersStore()
const { parseExcel } = useSupplierExcel()
const toast = useToast()

const dragOver = ref(false)
const loading = ref(false)
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

  loading.value = true
  try {
    const products = await parseExcel(file)
    store.setProducts(products, file.name)
    toast.add({
      title: 'Archivo cargado',
      description: `Se cargaron ${products.length} productos correctamente`,
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
    loading.value = false
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
      dragOver ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
    ]"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop="onDrop"
    @click="fileInput?.click()"
  >
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-primary-500" />
      <p class="text-lg font-medium text-gray-400">Procesando archivo...</p>
    </div>
    
    <div v-else class="flex flex-col items-center gap-4 text-center">
      <div class="p-4 rounded-full bg-gray-800">
        <UIcon name="i-lucide-upload-cloud" class="w-10 h-10 text-primary-500" />
      </div>
      <div>
        <h3 class="text-xl font-semibold text-white">Cargar lista de precios</h3>
        <p class="mt-2 text-gray-400">
          Arrastra tu archivo Excel aquí o haz clic para buscarlo
        </p>
      </div>
      <p class="text-sm text-gray-500">Soporta .xlsx y .xls</p>
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
