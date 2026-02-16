import { eq } from 'drizzle-orm'
import { recipes, recipeIngredients, recipeSteps } from '~~/server/database/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const allRecipes = await db.select().from(recipes).orderBy(recipes.name)

  const result = await Promise.all(allRecipes.map(async (recipe) => {
    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id))
      .orderBy(recipeIngredients.sortOrder)

    const steps = await db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, recipe.id))
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
  }))

  return result
})
