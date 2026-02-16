import { eq } from 'drizzle-orm'
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

const updateRecipeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  baseYield: z.number().positive().optional(),
  yieldUnit: z.string().min(1).optional(),
  category: z.enum(['Salsas', 'Jarabes', 'Sazonadores', 'Bebidas', 'Preparados']).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  steps: z.array(stepSchema).optional(),
  storageInstructions: z.object({
    temperatura: z.string().optional(),
    vidaUtil: z.string().optional(),
    condiciones: z.string().optional(),
    notas: z.string().optional()
  }).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw badRequest('ID inválido')

  const body = await validateBody(event, updateRecipeSchema)
  const db = useDB()

  const [existing] = await db.select().from(recipes).where(eq(recipes.id, id))
  if (!existing) throw notFound('Receta no encontrada')

  const now = new Date().toISOString()

  // Update recipe fields
  const updateData: Record<string, unknown> = { updatedAt: now }
  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.baseYield !== undefined) updateData.baseYield = String(body.baseYield)
  if (body.yieldUnit !== undefined) updateData.yieldUnit = body.yieldUnit
  if (body.category !== undefined) updateData.category = body.category
  if (body.storageInstructions !== undefined) updateData.storageInstructions = body.storageInstructions

  const rows = await db.update(recipes).set(updateData).where(eq(recipes.id, id)).returning()
  const updated = rows[0]!

  // Replace ingredients if provided
  if (body.ingredients !== undefined) {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id))
    if (body.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        body.ingredients.map((ing, index) => ({
          recipeId: id,
          name: ing.name,
          quantity: String(ing.quantity),
          unit: ing.unit,
          notes: ing.notes || null,
          sortOrder: index
        }))
      )
    }
  }

  // Replace steps if provided
  if (body.steps !== undefined) {
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id))
    if (body.steps.length > 0) {
      await db.insert(recipeSteps).values(
        body.steps.map(step => ({
          recipeId: id,
          description: step.description,
          sortOrder: step.order
        }))
      )
    }
  }

  // Fetch updated ingredients and steps
  const ingredients = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(recipeIngredients.sortOrder)

  const steps = await db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, id))
    .orderBy(recipeSteps.sortOrder)

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    baseYield: Number(updated.baseYield),
    yieldUnit: updated.yieldUnit,
    category: updated.category,
    storageInstructions: updated.storageInstructions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    ingredients: ingredients.map(ing => ({
      name: ing.name,
      quantity: Number(ing.quantity),
      unit: ing.unit,
      notes: ing.notes
    })),
    steps: steps.map(step => ({
      description: step.description,
      order: step.sortOrder
    }))
  }
})
