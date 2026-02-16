import { z } from 'zod'
import { recipes, recipeIngredients, recipeSteps } from '~~/server/database/schema'

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().optional()
})

const stepSchema = z.object({
  description: z.string().min(1),
  order: z.number().int().positive()
})

const createRecipeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  baseYield: z.number().positive('El rendimiento debe ser positivo'),
  yieldUnit: z.string().min(1, 'La unidad es requerida'),
  category: z.enum(['Salsas', 'Jarabes', 'Sazonadores', 'Bebidas', 'Preparados']),
  ingredients: z.array(ingredientSchema).default([]),
  steps: z.array(stepSchema).default([]),
  storageInstructions: z.object({
    temperatura: z.string().optional(),
    vidaUtil: z.string().optional(),
    condiciones: z.string().optional(),
    notas: z.string().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createRecipeSchema)
  const db = useDB()
  const now = new Date().toISOString()

  const rows = await db.insert(recipes).values({
    name: body.name,
    description: body.description || null,
    baseYield: String(body.baseYield),
    yieldUnit: body.yieldUnit,
    category: body.category,
    storageInstructions: body.storageInstructions || null,
    createdAt: now,
    updatedAt: now
  }).returning()

  const newRecipe = rows[0]!

  if (body.ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      body.ingredients.map((ing, index) => ({
        recipeId: newRecipe.id,
        name: ing.name,
        quantity: String(ing.quantity),
        unit: ing.unit,
        notes: ing.notes || null,
        sortOrder: index
      }))
    )
  }

  if (body.steps.length > 0) {
    await db.insert(recipeSteps).values(
      body.steps.map(step => ({
        recipeId: newRecipe.id,
        description: step.description,
        sortOrder: step.order
      }))
    )
  }

  setResponseStatus(event, 201)

  return {
    id: newRecipe.id,
    name: newRecipe.name,
    description: newRecipe.description,
    baseYield: Number(newRecipe.baseYield),
    yieldUnit: newRecipe.yieldUnit,
    category: newRecipe.category,
    storageInstructions: newRecipe.storageInstructions,
    createdAt: newRecipe.createdAt,
    updatedAt: newRecipe.updatedAt,
    ingredients: body.ingredients,
    steps: body.steps
  }
})
