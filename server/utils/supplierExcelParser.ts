import * as XLSX from 'xlsx'

export interface ParsedProduct {
  codigo: string
  descripcion: string
  empaque: string
  marca: string
  precioPublico: number
  precioMayoreo: number
  category: string
  searchText: string
}

export interface ParsedPriceList {
  month: string
  year: number
  products: ParsedProduct[]
}

function parsePrice(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val.replace(/[$,\s]/g, '')) || 0
  return 0
}

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

export function parseApysExcel(buffer: Buffer, fileName: string): ParsedPriceList {
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const sheetName = workbook.SheetNames.find(name => name.trim() === 'LISTA DE PRECIOS')
  if (!sheetName) {
    throw new Error('No se encontró la hoja "LISTA DE PRECIOS"')
  }

  const worksheet = workbook.Sheets[sheetName]!
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

  const products: ParsedProduct[] = []
  let currentCategory = ''

  // Skip title row (index 0) and header row (index 1)
  for (let i = 2; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number | undefined)[]
    if (!row || row.length === 0 || !row[0]) continue

    // Category row: only first column filled
    if (row[0] && !row[1]) {
      currentCategory = String(row[0]).trim()
      continue
    }

    // APYS column layout:
    // 0: CÓDIGO | 1: DESCRIPCIÓN | 2: EMPAQUE | 3: MARCA
    // 4: PRECIO PÚBLICO | 5: porción (info) | 6: etiqueta
    // 7: SOLO MAYOREO
    const codigo = row[0]
    const descripcion = row[1]

    if (codigo && descripcion) {
      const empaque = row[2] ? String(row[2]).trim() : ''
      const marca = row[3] ? String(row[3]).trim() : ''
      const codigoStr = String(codigo).trim()
      const descripcionStr = String(descripcion).trim()

      products.push({
        codigo: codigoStr,
        descripcion: descripcionStr,
        empaque,
        marca,
        precioPublico: parsePrice(row[4]),
        precioMayoreo: parsePrice(row[7]),
        category: currentCategory,
        searchText: `${codigoStr} ${descripcionStr} ${marca} ${empaque} ${currentCategory}`.toLowerCase()
      })
    }
  }

  // Extract month and year from filename
  const now = new Date()
  const monthMatch = fileName.match(new RegExp(`(${MONTH_NAMES.join('|')})`, 'i'))
  const month = monthMatch ? monthMatch[1]!.toUpperCase() : MONTH_NAMES[now.getMonth()]!
  const yearMatch = fileName.match(/20\d{2}/)
  const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear()

  return { month, year, products }
}
