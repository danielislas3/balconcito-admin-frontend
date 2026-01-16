export interface SupplierProduct {
  codigo: string
  descripcion: string
  empaque: string
  marca: string
  precioPublico: number
  precioMayoreo: number
  searchText: string
}

export interface OrderItem extends SupplierProduct {
  cantidad: number
}
