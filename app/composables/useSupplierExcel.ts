import * as XLSX from 'xlsx'
import type { OrderItem } from '~/types/suppliers'

export const useSupplierExcel = () => {
  // Generate APYS-specific order Excel
  const generateApysOrderExcel = (items: OrderItem[], total: number, month?: string, weekNumber?: number) => {
    const data: unknown[][] = [
      ['PEDIDO APYS'],
      ['Mes:', month || '', '', 'Semana:', weekNumber || ''],
      ['Fecha:', new Date().toLocaleDateString('es-MX')],
      [],
      ['CÓDIGO', 'DESCRIPCIÓN', 'EMPAQUE', 'CANTIDAD', 'PRECIO', 'SUBTOTAL']
    ]

    items.forEach((item) => {
      const subtotal = item.cantidad * item.precioPublico
      data.push([
        item.codigo,
        item.descripcion,
        item.empaque,
        item.cantidad,
        item.precioPublico,
        subtotal
      ])
    })

    data.push([])
    data.push(['', '', '', '', 'TOTAL:', total])

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido')

    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const fileName = `APYS_Pedido_${month || 'Mes'}_Semana${weekNumber || ''}_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  // Main generate function
  const generateOrderExcel = (items: OrderItem[], total: number, options?: {
    customerNumber?: string
    businessName?: string
    orderPerson?: string
    month?: string
    weekNumber?: number
  }) => {
    generateApysOrderExcel(items, total, options?.month, options?.weekNumber)
  }

  return {
    generateOrderExcel
  }
}
