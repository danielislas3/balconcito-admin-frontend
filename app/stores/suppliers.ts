import { defineStore } from 'pinia'
import type { SupplierProduct, OrderItem } from '~/types/suppliers'

export const useSuppliersStore = defineStore('suppliers', () => {
  const products = ref<SupplierProduct[]>([])
  const cart = ref<OrderItem[]>([])
  const isLoading = ref(false)
  const searchTerm = ref('')
  const fileName = ref('')
  
  const { generateOrderExcel } = useSupplierExcel()
  
  // Business configuration
  const businessConfig = ref({
    customerNumber: process.env.NUXT_PUBLIC_CUSTOMER_NUMBER || 'N. 19189',
    businessName: process.env.NUXT_PUBLIC_BUSINESS_NAME || 'El Balconcito',
    orderPerson: process.env.NUXT_PUBLIC_ORDER_PERSON || ''
  })
  
  // Getters
  const filteredProducts = computed(() => {
    if (!searchTerm.value.trim()) return []
    const terms = searchTerm.value.toLowerCase().split(' ').filter(t => t.length > 1)
    
    return products.value
      .filter(p => terms.every(term => p.searchText.includes(term)))
      .sort((a, b) => a.precioMayoreo - b.precioMayoreo)
      .slice(0, 20)
  })

  const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.precioMayoreo * item.cantidad), 0)
  })

  // Actions
  const setProducts = (newProducts: SupplierProduct[], name: string) => {
    products.value = newProducts
    fileName.value = name
    isLoading.value = true
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

  const clear = () => {
    products.value = []
    cart.value = []
    isLoading.value = false
    searchTerm.value = ''
    fileName.value = ''
  }

  const downloadOrder = () => {
    const config = businessConfig.value
    const orderOptions = {
      customerNumber: config.customerNumber,
      businessName: config.businessName,
      orderPerson: config.orderPerson
    }
    generateOrderExcel(cart.value, cartTotal.value, orderOptions)
  }

  return {
    products,
    cart,
    isLoading,
    searchTerm,
    fileName,
    filteredProducts,
    cartTotal,
    businessConfig,
    setProducts,
    addToCart,
    updateQuantity,
    removeFromCart,
    clear,
    downloadOrder
  }
})
