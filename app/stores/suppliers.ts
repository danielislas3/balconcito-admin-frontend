import { defineStore } from 'pinia'
import type { Supplier, SupplierProduct, OrderItem, PriceList, Order, PriceComparison } from '~/types/suppliers'
import { handleApiError } from '~/utils/errorHandler'

export const useSuppliersStore = defineStore('suppliers', () => {
  // State
  const supplier = ref<Supplier | null>(null)
  const priceLists = ref<PriceList[]>([])
  const currentPriceListId = ref<number | null>(null)
  const products = ref<SupplierProduct[]>([])
  const cart = ref<OrderItem[]>([])
  const orders = ref<Order[]>([])
  const priceComparisons = ref<PriceComparison[]>([])
  const showDashboard = ref(false)
  const searchTerm = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentPriceList = computed((): PriceList | null => {
    if (!currentPriceListId.value) return null
    return priceLists.value.find(list => list.id === currentPriceListId.value) || null
  })

  const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.precioPublico * item.cantidad), 0)
  })

  const cartItemCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.cantidad, 0)
  })

  const hasMultipleLists = computed(() => priceLists.value.length > 1)

  // Actions - API calls
  const fetchSupplier = async (slug = 'apys') => {
    loading.value = true
    error.value = null
    try {
      const suppliers = await $fetch<Supplier[]>('/api/suppliers')
      supplier.value = suppliers.find(s => s.slug === slug) || null
      if (supplier.value) {
        await fetchPriceLists()
      }
    } catch (err: unknown) {
      error.value = handleApiError(err, 'fetchSupplier')
    } finally {
      loading.value = false
    }
  }

  const fetchPriceLists = async () => {
    if (!supplier.value) return
    try {
      priceLists.value = await $fetch<PriceList[]>(`/api/suppliers/${supplier.value.id}/price-lists`)
      if (priceLists.value.length > 0 && !currentPriceListId.value) {
        currentPriceListId.value = priceLists.value[0]!.id
      }
    } catch (err: unknown) {
      handleApiError(err, 'fetchPriceLists')
    }
  }

  const uploadPriceList = async (file: File) => {
    if (!supplier.value) throw new Error('No hay proveedor seleccionado')
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch<PriceList & { replaced: boolean }>(`/api/suppliers/${supplier.value.id}/price-lists`, {
        method: 'POST',
        body: formData
      })

      await fetchPriceLists()
      currentPriceListId.value = result.id
      showDashboard.value = true
      cart.value = []

      return result
    } catch (err: unknown) {
      error.value = handleApiError(err, 'uploadPriceList')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePriceList = async (listId: number) => {
    if (!supplier.value) return
    try {
      await $fetch(`/api/suppliers/${supplier.value.id}/price-lists/${listId}`, { method: 'DELETE' })
      priceLists.value = priceLists.value.filter(l => l.id !== listId)
      if (currentPriceListId.value === listId) {
        currentPriceListId.value = priceLists.value[0]?.id || null
        cart.value = []
        products.value = []
      }
    } catch (err: unknown) {
      handleApiError(err, 'deletePriceList')
      throw err
    }
  }

  const searchProducts = async (term?: string) => {
    if (!supplier.value || !currentPriceListId.value) {
      products.value = []
      return
    }

    const search = term !== undefined ? term : searchTerm.value

    if (search.length === 1) {
      products.value = []
      return
    }

    try {
      const params = new URLSearchParams()
      if (search.length >= 2) params.set('search', search)
      params.set('limit', '50')

      const result = await $fetch<SupplierProduct[]>(
        `/api/suppliers/${supplier.value.id}/price-lists/${currentPriceListId.value}/products?${params}`
      )
      products.value = result
    } catch (err: unknown) {
      handleApiError(err, 'searchProducts')
    }
  }

  const setCurrentPriceList = (id: number) => {
    currentPriceListId.value = id
    cart.value = []
    showDashboard.value = true
    searchTerm.value = ''
    searchProducts('')
  }

  const fetchPriceComparison = async () => {
    if (!supplier.value) return
    try {
      const result = await $fetch<{ comparisons: PriceComparison[] }>(
        `/api/suppliers/${supplier.value.id}/price-comparison`
      )
      priceComparisons.value = result.comparisons
    } catch (err: unknown) {
      handleApiError(err, 'fetchPriceComparison')
    }
  }

  // Cart actions (local state)
  const addToCart = (product: SupplierProduct, cantidad = 1) => {
    const existing = cart.value.find(item => item.codigo === product.codigo)
    if (existing) {
      existing.cantidad += cantidad
    } else {
      cart.value.push({ ...product, cantidad })
    }
  }

  const updateQuantity = (codigo: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(codigo)
    } else {
      const item = cart.value.find(i => i.codigo === codigo)
      if (item) item.cantidad = cantidad
    }
  }

  const removeFromCart = (codigo: string) => {
    cart.value = cart.value.filter(item => item.codigo !== codigo)
  }

  const clearCart = () => {
    cart.value = []
  }

  // Order actions
  const saveOrder = async (notes?: string) => {
    if (!supplier.value || !currentPriceListId.value || cart.value.length === 0) return

    loading.value = true
    try {
      const order = await $fetch<Order>(`/api/suppliers/${supplier.value.id}/orders`, {
        method: 'POST',
        body: {
          priceListId: currentPriceListId.value,
          orderDate: new Date().toISOString().split('T')[0],
          weekNumber: getWeekNumber(new Date()),
          total: cartTotal.value,
          notes,
          items: cart.value.map(item => ({
            codigo: item.codigo,
            descripcion: item.descripcion,
            empaque: item.empaque,
            marca: item.marca,
            precio: item.precioPublico,
            cantidad: item.cantidad
          }))
        }
      })
      orders.value.unshift(order)
      clearCart()
      return order
    } catch (err: unknown) {
      error.value = handleApiError(err, 'saveOrder')
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadOrder = () => {
    if (!currentPriceList.value || cart.value.length === 0) return

    const { generateOrderExcel } = useSupplierExcel()
    generateOrderExcel(cart.value, cartTotal.value, {
      customerNumber: supplier.value?.config?.customerNumber,
      businessName: supplier.value?.config?.businessName,
      orderPerson: supplier.value?.config?.orderPerson,
      month: currentPriceList.value.month,
      weekNumber: getWeekNumber(new Date())
    })
  }

  const clear = () => {
    currentPriceListId.value = null
    cart.value = []
    products.value = []
    showDashboard.value = false
    searchTerm.value = ''
  }

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  return {
    supplier,
    priceLists,
    currentPriceListId,
    currentPriceList,
    products,
    cart,
    orders,
    priceComparisons,
    showDashboard,
    searchTerm,
    loading,
    error,
    cartTotal,
    cartItemCount,
    hasMultipleLists,
    fetchSupplier,
    fetchPriceLists,
    uploadPriceList,
    deletePriceList,
    searchProducts,
    setCurrentPriceList,
    fetchPriceComparison,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveOrder,
    downloadOrder,
    clear,
    getWeekNumber
  }
})
