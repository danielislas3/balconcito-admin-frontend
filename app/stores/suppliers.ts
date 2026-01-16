import { defineStore } from 'pinia'
import type { SupplierProduct, OrderItem, PriceList, Order, PriceComparison } from '~/types/suppliers'

export const useSuppliersStore = defineStore('suppliers', () => {
  const priceLists = ref<PriceList[]>([])
  const currentPriceListId = ref<string | null>(null)
  const cart = ref<OrderItem[]>([])
  const orders = ref<Order[]>([])
  const isLoading = ref(false)
  const searchTerm = ref('')

  const { generateOrderExcel } = useSupplierExcel()

  // Business configuration
  const businessConfig = ref({
    customerNumber: process.env.NUXT_PUBLIC_CUSTOMER_NUMBER || 'N. 19189',
    businessName: process.env.NUXT_PUBLIC_BUSINESS_NAME || 'El Balconcito',
    orderPerson: process.env.NUXT_PUBLIC_ORDER_PERSON || ''
  })

  // Getters
  const currentPriceList = computed((): PriceList | null => {
    if (!currentPriceListId.value) return null
    return priceLists.value.find(list => list.id === currentPriceListId.value) || null
  })

  const filteredProducts = computed(() => {
    if (!currentPriceList.value) return []

    // Si no hay búsqueda, mostrar los primeros 50 productos por defecto
    if (searchTerm.value.length === 0) {
      return currentPriceList.value.products
        .sort((a, b) => a.precioMayoreo - b.precioMayoreo)
        .slice(0, 50)
    }

    // Si solo hay 1 carácter, no buscar todavía
    if (searchTerm.value.length === 1) return []

    // Búsqueda normal con 2+ caracteres
    const terms = searchTerm.value.toLowerCase().split(' ').filter(t => t.length > 1)

    return currentPriceList.value.products
      .filter(p => terms.every(term => p.searchText.includes(term)))
      .sort((a, b) => a.precioMayoreo - b.precioMayoreo)
      .slice(0, 50)
  })

  const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.precioMayoreo * item.cantidad), 0)
  })

  const cartItemCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.cantidad, 0)
  })

  const hasMultipleLists = computed(() => {
    return priceLists.value.length > 1
  })

  const previousPriceList = computed((): PriceList | null => {
    if (priceLists.value.length < 2) return null
    const sortedLists = [...priceLists.value].sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )
    return sortedLists[1] || null
  })

  // Actions
  const addPriceList = (priceList: PriceList) => {
    priceLists.value.push(priceList)
    currentPriceListId.value = priceList.id
    isLoading.value = true
  }

  const setCurrentPriceList = (id: string) => {
    const list = priceLists.value.find(l => l.id === id)
    if (list) {
      currentPriceListId.value = id
      cart.value = []
      isLoading.value = true
    }
  }

  const deletePriceList = (id: string) => {
    const index = priceLists.value.findIndex(l => l.id === id)
    if (index !== -1) {
      priceLists.value.splice(index, 1)
      if (currentPriceListId.value === id) {
        currentPriceListId.value = priceLists.value[0]?.id || null
        cart.value = []
      }
    }
  }

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

  const clear = () => {
    currentPriceListId.value = null
    cart.value = []
    isLoading.value = false
    searchTerm.value = ''
  }

  const downloadOrder = () => {
    if (!currentPriceList.value || cart.value.length === 0) return

    const config = businessConfig.value
    const orderOptions = {
      customerNumber: config.customerNumber,
      businessName: config.businessName,
      orderPerson: config.orderPerson,
      supplierType: currentPriceList.value.supplierType,
      month: currentPriceList.value.month,
      weekNumber: currentPriceList.value.supplierType === 'apys' ? getWeekNumber(new Date()) : undefined
    }
    generateOrderExcel(cart.value, cartTotal.value, orderOptions)
  }

  const saveOrder = (notes?: string) => {
    if (!currentPriceListId.value || cart.value.length === 0) return

    const weekNumber = currentPriceList.value?.supplierType === 'apys' ? getWeekNumber(new Date()) : undefined
    const order: Order = {
      id: `order-${Date.now()}`,
      priceListId: currentPriceListId.value,
      orderDate: new Date(),
      weekNumber,
      items: [...cart.value],
      total: cartTotal.value,
      notes
    }

    orders.value.push(order)
    clearCart()
  }

  const getOrdersByPriceList = (priceListId: string): Order[] => {
    return orders.value.filter(order => order.priceListId === priceListId)
  }

  const getPriceComparison = (): PriceComparison[] => {
    const current = currentPriceList.value
    const previous = previousPriceList.value

    if (!current || !previous) return []

    const comparisons: PriceComparison[] = []

    current.products.forEach(currentProduct => {
      const previousProduct = previous.products.find(p => p.codigo === currentProduct.codigo)

      if (previousProduct) {
        const difference = currentProduct.precioMayoreo - previousProduct.precioMayoreo
        const percentageChange = (difference / previousProduct.precioMayoreo) * 100

        if (difference !== 0) {
          comparisons.push({
            codigo: currentProduct.codigo,
            descripcion: currentProduct.descripcion,
            currentPrice: currentProduct.precioMayoreo,
            previousPrice: previousProduct.precioMayoreo,
            difference,
            percentageChange
          })
        }
      }
    })

    return comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
  }

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  return {
    priceLists,
    currentPriceListId,
    currentPriceList,
    cart,
    orders,
    isLoading,
    searchTerm,
    filteredProducts,
    cartTotal,
    cartItemCount,
    hasMultipleLists,
    previousPriceList,
    businessConfig,
    addPriceList,
    setCurrentPriceList,
    deletePriceList,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clear,
    downloadOrder,
    saveOrder,
    getOrdersByPriceList,
    getPriceComparison,
    getWeekNumber
  }
}, {
  // persist: {
  //   storage: persistedState.localStorage,
  //   paths: ['priceLists', 'currentPriceListId', 'orders']
  // }
})
