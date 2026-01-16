import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Recipe, Ingredient } from '~/types/recipes'

export const useRecipesStore = defineStore('recipes', () => {
  // Initial default recipes
  const defaultRecipes: Recipe[] = [
    {
      id: 'jarabe-natural',
      name: 'Jarabe Natural 8:5',
      description: 'Tipo Madre Leña • Duradero sin refrigerar',
      baseYield: 10.5,
      yieldUnit: 'L',
      category: 'Jarabes',
      ingredients: [
        { name: 'Azúcar refinada blanca', quantity: 8, unit: 'kg' },
        { name: 'Agua purificada', quantity: 5, unit: 'L' },
        { name: 'Ácido cítrico', quantity: 16, unit: 'g' },
        { name: 'Benzoato de sodio', quantity: 5, unit: 'g' },
        { name: 'Jugo de limón', quantity: 1, unit: 'oz' }
      ],
      steps: [
        { order: 1, description: 'Calienta el agua en una olla limpia (acero inoxidable o aluminio grueso).' },
        { order: 2, description: 'Agrega el azúcar poco a poco, removiendo constantemente hasta disolver por completo.' },
        { order: 3, description: 'Incorpora el ácido cítrico y mezclar bien.' },
        { order: 4, description: 'Disuelva el benzoato de sodio en un recipiente pequeño aparte con un poco de la mezcla caliente. Una vez disuelto, incorpórelo a la mezcla principal.' },
        { order: 5, description: 'Calentar a 80 °C, cuidando que no hierva.' },
        { order: 6, description: 'Apaga el fuego y deja reposar 5-10 minutos.' },
        { order: 7, description: 'Agrega ralladura de limón o jugo de limón.' },
        { order: 8, description: 'Envasa el jarabe en botellas de vidrio esterilizadas.' },
        { order: 9, description: 'Cierra herméticamente y deja enfriar a temperatura ambiente.' }
      ],
      storageInstructions: 'Almacenar en lugar fresco y seco, sin luz directa. Una vez abierto, consumir en 2-3 meses.',
      lastUpdated: new Date()
    },
    {
      id: 'salsa-casa',
      name: 'Salsa de la Casa',
      description: 'Ficha técnica para batch estándar',
      baseYield: 1000,
      yieldUnit: 'g',
      category: 'Salsas',
      ingredients: [
        { name: 'Mayonesa', quantity: 400, unit: 'g' },
        { name: 'Ketchup', quantity: 170, unit: 'g' },
        { name: 'Pepinillos (incluye jugo)', quantity: 83, unit: 'g' },
        { name: 'Mostaza', quantity: 73, unit: 'g' },
        { name: 'Chipotle', quantity: 60, unit: 'g' },
        { name: 'Salsa inglesa', quantity: 45, unit: 'g' },
        { name: 'Glutamato monosódico', quantity: 6, unit: 'g' },
        { name: 'Jarabe natural', quantity: 83, unit: 'g' },
        { name: 'Ajo en polvo', quantity: 12, unit: 'g' },
        { name: 'Cebolla en polvo', quantity: 8, unit: 'g' },
        { name: 'Jitomate deshidratado', quantity: 7, unit: 'g' }
      ],
      steps: [
        { order: 1, description: 'Picar finamente los pepinillos (incluir el jugo del frasco).' },
        { order: 2, description: 'En un bowl grande, mezclar la mayonesa y el ketchup hasta integrar completamente.' },
        { order: 3, description: 'Agregar todos los ingredientes restantes y mezclar vigorosamente hasta obtener una mezcla homogénea.' },
        { order: 4, description: 'Refrigerar mínimo 2 horas antes de servir para que los sabores se integren.' }
      ],
      storageInstructions: 'Refrigerar siempre en recipiente hermético. Vida útil: 30 días refrigerado.',
      lastUpdated: new Date()
    },
    {
      id: 'jarabe-tamarindo',
      name: 'Jarabe de Tamarindo',
      description: 'Preparado Base',
      baseYield: 830,
      yieldUnit: 'g',
      category: 'Jarabes',
      ingredients: [
        { name: 'Pulpa de tamarindo colada', quantity: 400, unit: 'g' },
        { name: 'Jarabe natural', quantity: 430, unit: 'g' }
      ],
      steps: [
        { order: 1, description: 'Mezclar la pulpa colada con el jarabe natural en un recipiente limpio.' },
        { order: 2, description: 'Batir vigorosamente hasta obtener una mezcla homogénea.' },
        { order: 3, description: 'Envasar en botella limpia y refrigerar.' }
      ],
      storageInstructions: 'Refrigerar siempre. Vida útil: 8 semanas. Agitar antes de usar.',
      lastUpdated: new Date()
    },
    {
      id: 'extracto-menta',
      name: 'Extracto de Menta',
      description: 'Concentrado profesional',
      baseYield: 1,
      yieldUnit: 'L',
      category: 'Preparados',
      ingredients: [
        { name: 'Hojas de menta fresca', quantity: 55, unit: 'g' },
        { name: 'Vodka (35-40%)', quantity: 600, unit: 'ml' },
        { name: 'Ron blanco (35-40%)', quantity: 400, unit: 'ml' }
      ],
      steps: [
        { order: 1, description: 'Despojar y limpiar la menta con cuidado, sin tallos gruesos. Secar bien.' },
        { order: 2, description: 'Colocar las hojas en un frasco de vidrio limpio y verter el alcohol encima.' },
        { order: 3, description: 'Cerrar herméticamente y guardar en lugar oscuro y fresco (15-22°C).' },
        { order: 4, description: 'Agitar suavemente una vez al día. Dejar macerar 7-10 días.' },
        { order: 5, description: 'Colar con manta o filtro fino y guardar en botella oscura.' }
      ],
      storageInstructions: 'En lugar oscuro y fresco: 6-12 meses.',
      lastUpdated: new Date()
    },
    {
      id: 'sazonador-balconcito',
      name: 'Sazonador "Balconcito"',
      description: 'Versión final',
      baseYield: 1,
      yieldUnit: 'kg',
      category: 'Sazonadores',
      ingredients: [
        { name: 'Sal fina', quantity: 595, unit: 'g' },
        { name: 'Tomate en polvo', quantity: 100, unit: 'g' },
        { name: 'Paprika', quantity: 160, unit: 'g' },
        { name: 'Azúcar', quantity: 190, unit: 'g' },
        { name: 'Ajo en polvo', quantity: 36, unit: 'g' },
        { name: 'Cebolla en polvo', quantity: 40, unit: 'g' },
        { name: 'Glutamato monosódico (MSG)', quantity: 40, unit: 'g' },
        { name: 'Ácido cítrico', quantity: 35, unit: 'g' },
        { name: 'Pimienta negra molida', quantity: 7, unit: 'g' }
      ],
      steps: [
        { order: 1, description: 'Moler azúcar + pimienta negra: Pulsar 3-6 veces, no hacer polvo fino.' },
        { order: 2, description: 'Agregar MSG a la licuadora y moler pulsos cortos hasta integrar.' },
        { order: 3, description: 'Vaciar mezcla en bowl y agregar resto de ingredientes.' },
        { order: 4, description: 'Mezclar muy bien con espátula. El color debe quedar rojo uniforme.' },
        { order: 5, description: 'Reposar 2-3 horas antes de usar.' }
      ],
      storageInstructions: 'Frascos herméticos, lugar seco y fresco. Vida útil: 6-9 meses.',
      lastUpdated: new Date()
    },
    {
      id: 'jarabe-maracuya',
      name: 'Jarabe de Maracuyá',
      description: 'Preparado Base',
      baseYield: 1,
      yieldUnit: 'kg',
      category: 'Jarabes',
      ingredients: [
        { name: 'Pulpa de maracuyá colada', quantity: 500, unit: 'g' },
        { name: 'Jarabe natural', quantity: 500, unit: 'g' }
      ],
      steps: [
        { order: 1, description: 'Mezclar pulpa y jarabe proporción 1:1.' },
        { order: 2, description: 'Batir vigorosamente hasta homogeneizar.' },
        { order: 3, description: 'Envasar y refrigerar.' }
      ],
      storageInstructions: 'Refrigerar siempre. Vida útil: 8 semanas.',
      lastUpdated: new Date()
    }
  ]

  // State with persistence
  const recipes = useLocalStorage<Recipe[]>('balconcito-recipes', defaultRecipes, {
    serializer: {
      read: v => JSON.parse(v),
      write: v => JSON.stringify(v)
    },
    mergeDefaults: true
  })

  const activeRecipeId = ref<string | null>(null)
  const searchQuery = ref('')

  // Getters
  const activeRecipe = computed(() => recipes.value.find(r => r.id === activeRecipeId.value))

  const filteredRecipes = computed(() => {
    if (!searchQuery.value) return recipes.value
    const term = searchQuery.value.toLowerCase()
    return recipes.value.filter(r =>
      r.name.toLowerCase().includes(term)
      || r.category.toLowerCase().includes(term)
    )
  })

  // Actions
  const scaleIngredients = (recipeId: string, targetYield: number): Ingredient[] => {
    const recipe = recipes.value.find(r => r.id === recipeId)
    if (!recipe) return []

    const factor = targetYield / recipe.baseYield

    return recipe.ingredients.map(ing => ({
      ...ing,
      quantity: Number((ing.quantity * factor).toFixed(2))
    }))
  }

  const addRecipe = (recipe: Recipe) => {
    recipes.value.push(recipe)
  }

  const updateRecipe = (recipe: Recipe) => {
    const index = recipes.value.findIndex(r => r.id === recipe.id)
    if (index !== -1) recipes.value[index] = recipe
  }

  const deleteRecipe = (id: string) => {
    recipes.value = recipes.value.filter(r => r.id !== id)
    if (activeRecipeId.value === id) activeRecipeId.value = null
  }

  return {
    recipes,
    activeRecipeId,
    searchQuery,
    activeRecipe,
    filteredRecipes,
    scaleIngredients,
    addRecipe,
    updateRecipe,
    deleteRecipe
  }
})
