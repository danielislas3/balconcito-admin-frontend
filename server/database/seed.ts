import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import { recipes, recipeIngredients, recipeSteps, suppliers,payrollEmployees } from './schema'

import type { StorageInstructions } from './schema/recipes'
import type { SupplierConfig } from './schema/suppliers'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const db = drizzle(pool)

interface SeedRecipe {
  name: string
  description: string
  baseYield: string
  yieldUnit: string
  category: string
  storageInstructions: StorageInstructions | null
  ingredients: { name: string, quantity: string, unit: string, notes?: string }[]
  steps: { description: string, sortOrder: number }[]
}

const defaultRecipes: SeedRecipe[] = [
  {
    name: 'Jarabe Natural 8:5',
    description: 'Tipo Madre Lena - Duradero sin refrigerar',
    baseYield: '10.5',
    yieldUnit: 'L',
    category: 'Jarabes',
    storageInstructions: {
      condiciones: 'Lugar fresco y seco, sin luz directa',
      vidaUtil: '2-3 meses una vez abierto',
      notas: 'Almacenar en botellas de vidrio esterilizadas'
    },
    ingredients: [
      { name: 'Azucar refinada blanca', quantity: '8', unit: 'kg' },
      { name: 'Agua purificada', quantity: '5', unit: 'L' },
      { name: 'Acido citrico', quantity: '16', unit: 'g' },
      { name: 'Benzoato de sodio', quantity: '5', unit: 'g' },
      { name: 'Jugo de limon', quantity: '1', unit: 'oz' }
    ],
    steps: [
      { description: 'Calienta el agua en una olla limpia (acero inoxidable o aluminio grueso).', sortOrder: 1 },
      { description: 'Agrega el azucar poco a poco, removiendo constantemente hasta disolver por completo.', sortOrder: 2 },
      { description: 'Incorpora el acido citrico y mezclar bien.', sortOrder: 3 },
      { description: 'Disuelva el benzoato de sodio en un recipiente pequeno aparte con un poco de la mezcla caliente. Una vez disuelto, incorporelo a la mezcla principal.', sortOrder: 4 },
      { description: 'Calentar a 80 C, cuidando que no hierva.', sortOrder: 5 },
      { description: 'Apaga el fuego y deja reposar 5-10 minutos.', sortOrder: 6 },
      { description: 'Agrega ralladura de limon o jugo de limon.', sortOrder: 7 },
      { description: 'Envasa el jarabe en botellas de vidrio esterilizadas.', sortOrder: 8 },
      { description: 'Cierra hermeticamente y deja enfriar a temperatura ambiente.', sortOrder: 9 }
    ]
  },
  {
    name: 'Salsa de la Casa',
    description: 'Ficha tecnica para batch estandar',
    baseYield: '1000',
    yieldUnit: 'g',
    category: 'Salsas',
    storageInstructions: {
      temperatura: 'Refrigerar siempre',
      condiciones: 'Recipiente hermetico',
      vidaUtil: '30 dias refrigerado'
    },
    ingredients: [
      { name: 'Mayonesa', quantity: '400', unit: 'g' },
      { name: 'Ketchup', quantity: '170', unit: 'g' },
      { name: 'Pepinillos (incluye jugo)', quantity: '83', unit: 'g' },
      { name: 'Mostaza', quantity: '73', unit: 'g' },
      { name: 'Chipotle', quantity: '60', unit: 'g' },
      { name: 'Salsa inglesa', quantity: '45', unit: 'g' },
      { name: 'Glutamato monosodico', quantity: '6', unit: 'g' },
      { name: 'Jarabe natural', quantity: '83', unit: 'g' },
      { name: 'Ajo en polvo', quantity: '12', unit: 'g' },
      { name: 'Cebolla en polvo', quantity: '8', unit: 'g' },
      { name: 'Jitomate deshidratado', quantity: '7', unit: 'g' }
    ],
    steps: [
      { description: 'Picar finamente los pepinillos (incluir el jugo del frasco).', sortOrder: 1 },
      { description: 'En un bowl grande, mezclar la mayonesa y el ketchup hasta integrar completamente.', sortOrder: 2 },
      { description: 'Agregar todos los ingredientes restantes y mezclar vigorosamente hasta obtener una mezcla homogenea.', sortOrder: 3 },
      { description: 'Refrigerar minimo 2 horas antes de servir para que los sabores se integren.', sortOrder: 4 }
    ]
  },
  {
    name: 'Jarabe de Tamarindo',
    description: 'Preparado Base',
    baseYield: '830',
    yieldUnit: 'g',
    category: 'Jarabes',
    storageInstructions: {
      temperatura: 'Refrigerar siempre',
      vidaUtil: '8 semanas',
      notas: 'Agitar antes de usar'
    },
    ingredients: [
      { name: 'Pulpa de tamarindo colada', quantity: '400', unit: 'g' },
      { name: 'Jarabe natural', quantity: '430', unit: 'g' }
    ],
    steps: [
      { description: 'Mezclar la pulpa colada con el jarabe natural en un recipiente limpio.', sortOrder: 1 },
      { description: 'Batir vigorosamente hasta obtener una mezcla homogenea.', sortOrder: 2 },
      { description: 'Envasar en botella limpia y refrigerar.', sortOrder: 3 }
    ]
  },
  {
    name: 'Extracto de Menta',
    description: 'Concentrado profesional',
    baseYield: '1',
    yieldUnit: 'L',
    category: 'Preparados',
    storageInstructions: {
      condiciones: 'Lugar oscuro y fresco',
      vidaUtil: '6-12 meses'
    },
    ingredients: [
      { name: 'Hojas de menta fresca', quantity: '55', unit: 'g' },
      { name: 'Vodka (35-40%)', quantity: '600', unit: 'ml' },
      { name: 'Ron blanco (35-40%)', quantity: '400', unit: 'ml' }
    ],
    steps: [
      { description: 'Despojar y limpiar la menta con cuidado, sin tallos gruesos. Secar bien.', sortOrder: 1 },
      { description: 'Colocar las hojas en un frasco de vidrio limpio y verter el alcohol encima.', sortOrder: 2 },
      { description: 'Cerrar hermeticamente y guardar en lugar oscuro y fresco (15-22 C).', sortOrder: 3 },
      { description: 'Agitar suavemente una vez al dia. Dejar macerar 7-10 dias.', sortOrder: 4 },
      { description: 'Colar con manta o filtro fino y guardar en botella oscura.', sortOrder: 5 }
    ]
  },
  {
    name: 'Sazonador "Balconcito"',
    description: 'Version final',
    baseYield: '1',
    yieldUnit: 'kg',
    category: 'Sazonadores',
    storageInstructions: {
      condiciones: 'Frascos hermeticos, lugar seco y fresco',
      vidaUtil: '6-9 meses'
    },
    ingredients: [
      { name: 'Sal fina', quantity: '595', unit: 'g' },
      { name: 'Tomate en polvo', quantity: '100', unit: 'g' },
      { name: 'Paprika', quantity: '160', unit: 'g' },
      { name: 'Azucar', quantity: '190', unit: 'g' },
      { name: 'Ajo en polvo', quantity: '36', unit: 'g' },
      { name: 'Cebolla en polvo', quantity: '40', unit: 'g' },
      { name: 'Glutamato monosodico (MSG)', quantity: '40', unit: 'g' },
      { name: 'Acido citrico', quantity: '35', unit: 'g' },
      { name: 'Pimienta negra molida', quantity: '7', unit: 'g' }
    ],
    steps: [
      { description: 'Moler azucar + pimienta negra: Pulsar 3-6 veces, no hacer polvo fino.', sortOrder: 1 },
      { description: 'Agregar MSG a la licuadora y moler pulsos cortos hasta integrar.', sortOrder: 2 },
      { description: 'Vaciar mezcla en bowl y agregar resto de ingredientes.', sortOrder: 3 },
      { description: 'Mezclar muy bien con espatula. El color debe quedar rojo uniforme.', sortOrder: 4 },
      { description: 'Reposar 2-3 horas antes de usar.', sortOrder: 5 }
    ]
  },
  {
    name: 'Jarabe de Maracuya',
    description: 'Preparado Base',
    baseYield: '1',
    yieldUnit: 'kg',
    category: 'Jarabes',
    storageInstructions: {
      temperatura: 'Refrigerar siempre',
      vidaUtil: '8 semanas'
    },
    ingredients: [
      { name: 'Pulpa de maracuya colada', quantity: '500', unit: 'g' },
      { name: 'Jarabe natural', quantity: '500', unit: 'g' }
    ],
    steps: [
      { description: 'Mezclar pulpa y jarabe proporcion 1:1.', sortOrder: 1 },
      { description: 'Batir vigorosamente hasta homogeneizar.', sortOrder: 2 },
      { description: 'Envasar y refrigerar.', sortOrder: 3 }
    ]
  }
]

async function seed() {
  console.log('Seeding recipes...')

  for (const recipe of defaultRecipes) {
    const [newRecipe] = await db.insert(recipes).values({
      name: recipe.name,
      description: recipe.description,
      baseYield: recipe.baseYield,
      yieldUnit: recipe.yieldUnit,
      category: recipe.category,
      storageInstructions: recipe.storageInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()

    if (recipe.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        recipe.ingredients.map((ing, index) => ({
          recipeId: newRecipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
          sortOrder: index
        }))
      )
    }

    if (recipe.steps.length > 0) {
      await db.insert(recipeSteps).values(
        recipe.steps.map(step => ({
          recipeId: newRecipe.id,
          description: step.description,
          sortOrder: step.sortOrder
        }))
      )
    }

    console.log(`  + ${recipe.name}`)
  }

  console.log(`Seeded ${defaultRecipes.length} recipes`)

  // =========================================================================
  // SUPPLIERS
  // =========================================================================

  console.log('\nSeeding suppliers...')

  // Check if APYS already exists
  const [existingApys] = await db.select().from(suppliers).where(eq(suppliers.slug, 'apys'))

  if (!existingApys) {
    const apysConfig: SupplierConfig = {
      customerNumber: 'N. 19189',
      businessName: 'El Balconcito',
      orderPerson: ''
    }

    await db.insert(suppliers).values({
      name: 'APYS',
      slug: 'apys',
      config: apysConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    console.log('  + APYS')
  } else {
    console.log('  ~ APYS (already exists)')
  }

  console.log('Seeded suppliers')
}

async function seedPayrollEmployees() {
  console.log('Seeding payroll employees...')

  const defaultEmployees = [
    { name: 'Daniel', employeeId: 'EMP-001', baseHourlyRate: '62.5', currency: 'MXN' },
    { name: 'Raúl', employeeId: 'EMP-002', baseHourlyRate: '62.5', currency: 'MXN' }
  ]

  const now = new Date().toISOString()

  for (const emp of defaultEmployees) {
    const existing = await db
      .select({ id: payrollEmployees.id })
      .from(payrollEmployees)
      .where(eq(payrollEmployees.employeeId, emp.employeeId))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  ~ ${emp.name} (already exists)`)
      continue
    }

    await db.insert(payrollEmployees).values({
      name: emp.name,
      employeeId: emp.employeeId,
      baseHourlyRate: emp.baseHourlyRate,
      currency: emp.currency,
      createdAt: now,
      updatedAt: now
    })
    console.log(`  + ${emp.name}`)
  }

  console.log(`Seeded ${defaultEmployees.length} payroll employees`)
}

async function main() {
  await seed()
  await seedPayrollEmployees()
}

main()
  .then(() => {
    console.log('Seed complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
