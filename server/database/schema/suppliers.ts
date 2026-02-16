import { pgTable, serial, varchar, text, numeric, integer, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core'

// ============================================================================
// SUPPLIER CONFIG TYPE
// ============================================================================

export interface SupplierConfig {
  customerNumber?: string
  businessName?: string
  orderPerson?: string
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliers = pgTable('suppliers', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 100 }).notNull(),
  config: jsonb().$type<SupplierConfig>(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
}, table => [
  uniqueIndex('suppliers_slug_idx').on(table.slug)
])

// ============================================================================
// SUPPLIER PRICE LISTS
// ============================================================================

export const supplierPriceLists = pgTable('supplier_price_lists', {
  id: serial().primaryKey(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  month: varchar({ length: 20 }).notNull(),
  year: integer().notNull(),
  fileName: varchar('file_name', { length: 255 }),
  totalProducts: integer('total_products').default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
}, table => [
  uniqueIndex('supplier_price_lists_supplier_month_year_idx').on(table.supplierId, table.month, table.year),
  index('supplier_price_lists_supplier_id_idx').on(table.supplierId)
])

// ============================================================================
// SUPPLIER PRODUCTS
// ============================================================================

export const supplierProducts = pgTable('supplier_products', {
  id: serial().primaryKey(),
  priceListId: integer('price_list_id').notNull().references(() => supplierPriceLists.id, { onDelete: 'cascade' }),
  codigo: varchar({ length: 100 }).notNull(),
  descripcion: varchar({ length: 500 }).notNull(),
  empaque: varchar({ length: 255 }),
  marca: varchar({ length: 255 }),
  precioPublico: numeric('precio_publico', { precision: 10, scale: 2 }).default('0'),
  precioMayoreo: numeric('precio_mayoreo', { precision: 10, scale: 2 }).default('0'),
  category: varchar({ length: 255 }),
  searchText: text('search_text')
}, table => [
  index('supplier_products_price_list_id_idx').on(table.priceListId)
])

// ============================================================================
// SUPPLIER ORDERS
// ============================================================================

export const supplierOrders = pgTable('supplier_orders', {
  id: serial().primaryKey(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  priceListId: integer('price_list_id').notNull().references(() => supplierPriceLists.id),
  orderDate: varchar('order_date').notNull(),
  weekNumber: integer('week_number'),
  total: numeric({ precision: 10, scale: 2 }).default('0'),
  notes: text(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
}, table => [
  index('supplier_orders_supplier_id_idx').on(table.supplierId),
  index('supplier_orders_price_list_id_idx').on(table.priceListId)
])

// ============================================================================
// SUPPLIER ORDER ITEMS
// ============================================================================

export const supplierOrderItems = pgTable('supplier_order_items', {
  id: serial().primaryKey(),
  orderId: integer('order_id').notNull().references(() => supplierOrders.id, { onDelete: 'cascade' }),
  codigo: varchar({ length: 100 }),
  descripcion: varchar({ length: 500 }),
  empaque: varchar({ length: 255 }),
  marca: varchar({ length: 255 }),
  precio: numeric({ precision: 10, scale: 2 }),
  cantidad: integer().notNull(),
  subtotal: numeric({ precision: 10, scale: 2 })
}, table => [
  index('supplier_order_items_order_id_idx').on(table.orderId)
])
