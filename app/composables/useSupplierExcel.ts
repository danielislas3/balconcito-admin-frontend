import * as XLSX from 'xlsx'
import type { SupplierProduct, OrderItem } from '~/types/suppliers'

export const useSupplierExcel = () => {
  const parseExcel = async (file: File): Promise<SupplierProduct[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('lista de precios')) || workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName!]
          const jsonData = XLSX.utils.sheet_to_json(worksheet!, { header: 1 }) as any[][]
          
          const products: SupplierProduct[] = []
          let headerFound = false
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!row || row.length === 0) continue

            if (row[0] === 'CÓDIGO' || row[0] === 'CLAVE') {
              headerFound = true
              continue
            }
            
            if (headerFound && row[0] && typeof row[0] === 'string' && row[0].match(/^[A-Z0-9]+$/i)) {
              // Check if it's a category header (all caps, no other data)
              if (row[0] === row[0].toUpperCase() && !row[1] && row[0].length > 10) {
                continue
              }
              
              const codigo = row[0]
              const descripcion = row[1] || ''
              const empaque = row[2] || ''
              const marca = row[3] || ''
              const precioPublico = parseFloat(row[4]) || 0
              const precioMayoreo = parseFloat(row[7]) || parseFloat(row[4]) || 0
              
              if (descripcion && precioMayoreo > 0) {
                products.push({
                  codigo,
                  descripcion,
                  empaque,
                  marca,
                  precioPublico,
                  precioMayoreo,
                  searchText: `${codigo} ${descripcion} ${marca} ${empaque}`.toLowerCase()
                })
              }
            }
          }
          resolve(products)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const generateOrderExcel = (items: OrderItem[], total: number, options?: { customerNumber?: string, businessName?: string, orderPerson?: string }) => {
    const wb = XLSX.utils.book_new()
    
    // Configurable business data - use provided options or fallback to environment variables
    const customerNumber = options?.customerNumber || process.env.NUXT_PUBLIC_CUSTOMER_NUMBER || 'N. 19189'
    const businessName = options?.businessName || process.env.NUXT_PUBLIC_BUSINESS_NAME || 'El Balconcito'
    const orderPerson = options?.orderPerson || process.env.NUXT_PUBLIC_ORDER_PERSON || ''
    
    const orderData: any[][] = [
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['Formato de pedidos _____', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['', 'Numero de Cliente', customerNumber, '', '', '', '', '', '', '', '', ''],
      ['', 'Nombre del Negocio', businessName, '', '', '', '', '', '', '', '', ''],
      ['', 'Quien hace el pedido:', '', orderPerson, '', '', '', '', '', '', '', ''],
      ['', 'para llenar el formato de pedidos solo COPIA Y PEGA toda la fila de la lista de precios', '', '', '', '', '', '', '', '', '', ''],
      ['', 'El monto puede variar si el producto contiene impuestos IEPS O IVA', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['CÓDIGO', 'DESCRIPCIÓN', 'EMPAQUE', 'MARCA', 'MENUDEO', 'porción (solo informativo', '', 'MAYOREO', 'porción (solo informativo', '', 'CANTIDAD', 'TOTAL'],
    ]

    items.forEach(item => {
      orderData.push([
        item.codigo,
        item.descripcion,
        item.empaque,
        item.marca,
        item.precioPublico,
        '',
        '',
        item.precioMayoreo,
        '',
        '',
        item.cantidad,
        item.precioMayoreo * item.cantidad
      ])
    })

    for (let i = 0; i < 10; i++) {
      orderData.push(['', '', '', '', '', '', '', '', '', '', 0, 0])
    }

    orderData.push(['', '', '', '', '', '', '', '', '', 'TOTAL:', '', total])

    const ws = XLSX.utils.aoa_to_sheet(orderData)
    
    ws['!cols'] = [
      { wch: 12 }, // CÓDIGO
      { wch: 50 }, // DESCRIPCIÓN
      { wch: 25 }, // EMPAQUE
      { wch: 15 }, // MARCA
      { wch: 10 }, // MENUDEO
      { wch: 10 },
      { wch: 5 },
      { wch: 10 }, // MAYOREO
      { wch: 10 },
      { wch: 5 },
      { wch: 10 }, // CANTIDAD
      { wch: 12 }, // TOTAL
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'PEDIDO')
    
    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`
    XLSX.writeFile(wb, `pedido_${dateStr}.xlsx`)
  }

  return {
    parseExcel,
    generateOrderExcel
  }
}
