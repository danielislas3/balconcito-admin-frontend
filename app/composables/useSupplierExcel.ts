import * as XLSX from 'xlsx'
import type { SupplierProduct, OrderItem, PriceList, SupplierType } from '~/types/suppliers'

export const useSupplierExcel = () => {
  // Parse price from cell: handles numbers and strings like "$ 160.65"
  const parsePrice = (val: any): number => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseFloat(val.replace(/[$,\s]/g, '')) || 0
    return 0
  }

  // Detect supplier type based on file content
  const detectSupplierType = (workbook: XLSX.WorkBook, fileName: string): SupplierType => {
    // Check for APYS indicators
    const hasApysSheet = workbook.SheetNames.some(name => name.trim() === 'LISTA DE PRECIOS')
    if (hasApysSheet || fileName.toLowerCase().includes('apys')) {
      return 'apys'
    }

    return 'generic'
  }

  // Parse APYS-specific Excel format
  const parseApysExcel = (workbook: XLSX.WorkBook, file: File): PriceList => {
    const sheetName = workbook.SheetNames.find(name => name.trim() === 'LISTA DE PRECIOS')
    if (!sheetName) {
      throw new Error('No se encontró la hoja "LISTA DE PRECIOS"')
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    const products: SupplierProduct[] = []
    let currentCategory = ''

    // Skip title row (index 0) and header row (index 1)
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i]

      if (!row || row.length === 0 || !row[0]) continue

      // Check if this is a category row (only has first column filled)
      if (row[0] && !row[1]) {
        currentCategory = String(row[0]).trim()
        continue
      }

      // APYS column layout:
      // 0: CÓDIGO | 1: DESCRIPCIÓN | 2: EMPAQUE | 3: MARCA
      // 4: PRECIO PÚBLICO | 5: porción (info) | 6: etiqueta
      // 7: SOLO MAYOREO  | 8: porción (info) | 9: etiqueta
      const codigo = row[0]
      const descripcion = row[1]
      const empaque = row[2]
      const marca = row[3]

      if (codigo && descripcion) {
        products.push({
          codigo: String(codigo).trim(),
          descripcion: String(descripcion).trim(),
          empaque: empaque ? String(empaque).trim() : '',
          marca: marca ? String(marca).trim() : '',
          precioPublico: parsePrice(row[4]),
          precioMayoreo: parsePrice(row[7]),
          category: currentCategory,
          searchText: `${codigo} ${descripcion} ${marca} ${empaque} ${currentCategory}`.toLowerCase()
        })
      }
    }

    // Extract month and year from filename
    const now = new Date()
    const monthMatch = file.name.match(/(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)/i)
    const month = monthMatch ? monthMatch[1].toUpperCase() : now.toLocaleString('es-MX', { month: 'long' }).toUpperCase()
    const yearMatch = file.name.match(/20\d{2}/)
    const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear()

    return {
      id: `apys-${Date.now()}`,
      supplierType: 'apys',
      fileName: file.name,
      month,
      year,
      uploadDate: now,
      products,
      totalProducts: products.length
    }
  }

  // Parse generic supplier Excel format
  const parseGenericExcel = (workbook: XLSX.WorkBook, file: File): PriceList => {
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
        const precioPublico = parsePrice(row[4])
        const precioMayoreo = parsePrice(row[7]) || parsePrice(row[4])

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

    return {
      id: `generic-${Date.now()}`,
      supplierType: 'generic',
      fileName: file.name,
      uploadDate: new Date(),
      products,
      totalProducts: products.length
    }
  }

  // Main parse function
  const parseExcel = async (file: File): Promise<PriceList> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })

          const supplierType = detectSupplierType(workbook, file.name)

          let priceList: PriceList
          if (supplierType === 'apys') {
            priceList = parseApysExcel(workbook, file)
          } else {
            priceList = parseGenericExcel(workbook, file)
          }

          resolve(priceList)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = error => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  // Generate APYS-specific order Excel
  const generateApysOrderExcel = (items: OrderItem[], total: number, month?: string, weekNumber?: number) => {
    const data: any[][] = [
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
      { wch: 12 }, // CÓDIGO
      { wch: 40 }, // DESCRIPCIÓN
      { wch: 20 }, // EMPAQUE
      { wch: 10 }, // CANTIDAD
      { wch: 12 }, // PRECIO
      { wch: 12 } // SUBTOTAL
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido')

    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const fileName = `APYS_Pedido_${month || 'Mes'}_Semana${weekNumber || ''}_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  // Generate generic order Excel
  const generateGenericOrderExcel = (items: OrderItem[], total: number, options?: { customerNumber?: string, businessName?: string, orderPerson?: string }) => {
    const wb = XLSX.utils.book_new()

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
      ['CÓDIGO', 'DESCRIPCIÓN', 'EMPAQUE', 'MARCA', 'MENUDEO', 'porción (solo informativo', '', 'MAYOREO', 'porción (solo informativo', '', 'CANTIDAD', 'TOTAL']
    ]

    items.forEach((item) => {
      orderData.push([
        item.codigo,
        item.descripcion,
        item.empaque,
        item.marca,
        item.precioPublico,
        '',
        '',
        item.precioPublico,
        '',
        '',
        item.cantidad,
        item.precioPublico * item.cantidad
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
      { wch: 12 } // TOTAL
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'PEDIDO')

    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`
    XLSX.writeFile(wb, `pedido_${dateStr}.xlsx`)
  }

  // Main generate function
  const generateOrderExcel = (items: OrderItem[], total: number, options?: {
    customerNumber?: string
    businessName?: string
    orderPerson?: string
    supplierType?: SupplierType
    month?: string
    weekNumber?: number
  }) => {
    if (options?.supplierType === 'apys') {
      generateApysOrderExcel(items, total, options.month, options.weekNumber)
    } else {
      generateGenericOrderExcel(items, total, options)
    }
  }

  return {
    parseExcel,
    generateOrderExcel
  }
}
