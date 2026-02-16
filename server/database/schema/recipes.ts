import { pgTable, serial, varchar, text, numeric, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

export const recipes = pgTable('recipes', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  baseYield: numeric('base_yield', { precision: 10, scale: 2 }).notNull(),
  yieldUnit: varchar('yield_unit', { length: 50 }).notNull(),
  category: varchar({ length: 50 }).notNull(),
  storageInstructions: jsonb('storage_instructions').$type<StorageInstructions>(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
})

export interface StorageInstructions {
  temperatura?: string
  vidaUtil?: string
  condiciones?: string
  notas?: string
}

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial().primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  quantity: numeric({ precision: 10, scale: 2 }).notNull(),
  unit: varchar({ length: 50 }).notNull(),
  notes: text(),
  sortOrder: integer('sort_order').default(0)
})

export const recipeSteps = pgTable('recipe_steps', {
  id: serial().primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  description: text().notNull(),
  sortOrder: integer('sort_order').notNull()
})
