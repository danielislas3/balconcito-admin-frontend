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

export interface StorageInstructions {
  temperatura?: string
  vidaUtil?: string
  condiciones?: string
  notas?: string
}

export interface Recipe {
  id: number
  name: string
  description?: string
  baseYield: number
  yieldUnit: string
  category: RecipeCategory
  ingredients: Ingredient[]
  steps: RecipeStep[]
  storageInstructions?: StorageInstructions
  createdAt?: string
  updatedAt?: string
}
