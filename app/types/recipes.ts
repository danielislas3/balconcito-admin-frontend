export interface Ingredient {
  name: string
  quantity: number
  unit: string
  notes?: string
}

export interface RecipeStep {
  description: string
  order: number
}

export type RecipeCategory = 'Salsas' | 'Jarabes' | 'Sazonadores' | 'Bebidas' | 'Preparados'

export interface Recipe {
  id: string
  name: string
  description?: string
  baseYield: number
  yieldUnit: string
  category: RecipeCategory
  ingredients: Ingredient[]
  steps: RecipeStep[]
  storageInstructions?: string
  lastUpdated: Date
}
