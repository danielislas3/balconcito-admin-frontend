export interface SupplierConfig {
  customerNumber?: string
  businessName?: string
  orderPerson?: string
}

export interface Supplier {
  id: number
  name: string
  slug: string
  config?: SupplierConfig
  createdAt?: string
  updatedAt?: string
}

export interface SupplierProduct {
  id?: number
  codigo: string
  descripcion: string
  empaque: string
  marca: string
  precioPublico: number
  precioMayoreo: number
  category?: string
}

export interface OrderItem extends SupplierProduct {
  cantidad: number
}

export interface PriceList {
  id: number
  supplierId: number
  month: string
  year: number
  fileName?: string
  totalProducts: number
  createdAt?: string
  updatedAt?: string
}

export interface Order {
  id: number
  supplierId: number
  priceListId: number
  orderDate: string
  weekNumber?: number
  items: OrderItem[]
  total: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface PriceComparison {
  codigo: string
  descripcion: string
  currentPrice: number
  previousPrice: number
  difference: number
  percentageChange: number
}
