export type SupplierType = 'generic' | 'apys'

export interface SupplierProduct {
  codigo: string
  descripcion: string
  empaque: string
  marca: string
  precioPublico: number
  precioMayoreo: number
  precioDistribuidor?: number
  precioEspecial?: number
  category?: string
  searchText: string
}

export interface OrderItem extends SupplierProduct {
  cantidad: number
}

export interface PriceList {
  id: string
  supplierType: SupplierType
  fileName: string
  month?: string
  year?: number
  uploadDate: Date
  products: SupplierProduct[]
  totalProducts: number
}

export interface Order {
  id: string
  priceListId: string
  orderDate: Date
  weekNumber?: number
  items: OrderItem[]
  total: number
  notes?: string
}

export interface PriceComparison {
  codigo: string
  descripcion: string
  currentPrice: number
  previousPrice: number
  difference: number
  percentageChange: number
}
