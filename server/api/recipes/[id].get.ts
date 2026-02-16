import { eq } from 'drizzle-orm'
import { recipes, recipeIngredients, recipeSteps } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw badRequest('ID inválido')

  const db = useDB()

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id))
  if (!recipe) throw notFound('Receta no encontrada')

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
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    baseYield: Number(recipe.baseYield),
    yieldUnit: recipe.yieldUnit,
    category: recipe.category,
    storageInstructions: recipe.storageInstructions,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
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
