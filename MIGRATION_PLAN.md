# Plan de Migración: Rails → Nuxt Server Routes

## Objetivo

Migrar los módulos funcionales del backend Rails (balconcito-backend) a **server routes de Nuxt (Nitro/H3)** dentro de balconcito-frontend, eliminando la necesidad del hosting separado del backend.

Los módulos que NO están 100% funcionales (cuentas, gastos, cierres, reembolsos, dashboard, tarjetas/préstamos, Loyverse) se rehacen desde cero en el futuro, no se migran.

## Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| **ORM** | Drizzle ORM | Ligero, type-safe, SQL-first. Ideal para Nitro. |
| **BD** | PostgreSQL (misma instancia) | Misma BD en dev y prod. Sin migración de datos. |
| **Transición** | Proxy a Rails | Endpoints no migrados se proxean al backend actual. Deploy gradual. |
| **Auth** | Decidir al llegar al módulo | Empezamos con módulos que no requieren auth. |
| **Recetas** | Persistir en BD | Crear tabla en PostgreSQL, reemplazar localStorage. |

---

## Stack del Server Side

```
Nuxt (Nitro/H3)
├── server/api/          → Endpoints migrados
├── server/utils/        → Helpers compartidos (DB, auth, validation)
├── server/database/     → Drizzle config, schema, migraciones
└── server/routes/       → Proxy catch-all a Rails (temporal)
```

### Dependencias Nuevas

```bash
# ORM y BD
drizzle-orm pg drizzle-kit
# Tipos
@types/pg
# Validación server-side
zod  # (ya está instalado)
```

---

## Módulos a Migrar (solo los funcionales al 100%)

| Fase | Módulo | Estado actual | Complejidad |
|------|--------|---------------|-------------|
| **0** | Setup Base (Drizzle + Proxy) | N/A | Media |
| **1** | Recetas | Funcional (localStorage) | Baja |
| **2** | Proveedores | Funcional (en memoria) | Media |
| **3** | Autenticación | Funcional (JWT + Rails) | Media |
| **4** | Nómina | Funcional (API Rails) | Muy Alta |

### Módulos que se rehacen desde cero (futuro, fuera de este plan)

Estos módulos tienen frontend parcial pero el backend no está completo o funcional.
Se diseñarán e implementarán desde cero cuando llegue el momento:

- Cuentas (Accounts)
- Métodos de Pago
- Gastos (Expenses)
- Cierres de Turno (Turn Closures)
- Reembolsos (Reimbursements)
- Dashboard y Métricas
- Tarjetas de Crédito y Préstamos
- Integración Loyverse

Para referencia de lo que se quiere a largo plazo, consultar la documentación en
`/Users/danielorio/work/balconcito-admin/docs/`.

---

## Fase 0: Setup Base
**Complejidad: Media** | Estimación: 1 sesión

- [ ] Instalar Drizzle ORM + pg driver
- [ ] Configurar conexión a PostgreSQL (`server/utils/db.ts`)
- [ ] Setup de Drizzle Kit (`drizzle.config.ts`) para introspección del schema existente
- [ ] Introspeccionar BD existente → generar schema Drizzle desde las tablas Rails
- [ ] Configurar proxy catch-all a Rails para endpoints no migrados
- [ ] Verificar que el proxy funciona (todo sigue operando vía Rails)
- [ ] Documentar variables de entorno necesarias

**Nota importante sobre la BD:**
- En dev y prod usamos la **misma instancia PostgreSQL** que usa Rails
- NO creamos migraciones que modifiquen tablas existentes de Rails
- Para tablas nuevas (recetas, proveedores) sí creamos migraciones Drizzle
- Drizzle introspecciona el schema existente con `drizzle-kit pull`

---

## Fase 1: Recetas (Módulo nuevo - sin API Rails)
**Complejidad: Baja** | Dependencia: Fase 0

**Estado actual:** Pure frontend con localStorage. No existe en el backend Rails.

**Qué hacer:**
- [ ] Crear tabla `recipes` en PostgreSQL (migración nueva)
- [ ] Crear tablas `recipe_ingredients` y `recipe_steps` (relaciones)
- [ ] Definir schema Drizzle para las 3 tablas
- [ ] Crear server routes CRUD:
  - `GET /api/recipes` - Listar recetas (con filtro por categoría/búsqueda)
  - `GET /api/recipes/:id` - Detalle de receta
  - `POST /api/recipes` - Crear receta
  - `PATCH /api/recipes/:id` - Actualizar receta
  - `DELETE /api/recipes/:id` - Eliminar receta
- [ ] Crear seed con las recetas default del store actual
- [ ] Migrar store de localStorage → API calls
- [ ] Mantener `scaleIngredients()` en el frontend (es cálculo puro)
- [ ] Validación con Zod en server routes

**Schema propuesto:**
```sql
-- recipes
id                    SERIAL PRIMARY KEY
name                  VARCHAR(255) NOT NULL
description           TEXT
base_yield            DECIMAL(10,2) NOT NULL
yield_unit            VARCHAR(50) NOT NULL
category              VARCHAR(50) NOT NULL  -- 'Salsas'|'Jarabes'|'Sazonadores'|'Bebidas'|'Preparados'
storage_instructions  TEXT
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

-- recipe_ingredients
id          SERIAL PRIMARY KEY
recipe_id   INTEGER REFERENCES recipes(id) ON DELETE CASCADE
name        VARCHAR(255) NOT NULL
quantity    DECIMAL(10,2) NOT NULL
unit        VARCHAR(50) NOT NULL
notes       TEXT
sort_order  INTEGER DEFAULT 0

-- recipe_steps
id          SERIAL PRIMARY KEY
recipe_id   INTEGER REFERENCES recipes(id) ON DELETE CASCADE
description TEXT NOT NULL
sort_order  INTEGER NOT NULL
```

---

## Fase 2: Proveedores (Módulo nuevo - sin API Rails)
**Complejidad: Media** | Dependencia: Fase 0

**Estado actual:** Pure frontend, no persiste datos (ni localStorage). Carga Excel en memoria.

**Qué hacer:**
- [ ] Crear tablas con namespace `supplier_*` para evitar conflictos con Loyverse/POS:
  - `suppliers` - Datos del proveedor (nombre, contacto, tipo)
  - `supplier_price_lists` - Listas de precios subidas (archivo, fecha, proveedor)
  - `supplier_products` - Productos de cada lista (código, descripción, precios)
  - `supplier_orders` - Órdenes de compra a proveedores
  - `supplier_order_items` - Items de cada orden
- [ ] Server routes CRUD para proveedores y listas de precios
- [ ] Endpoint para upload/parseo de Excel (mover lógica de `useSupplierExcel` al server)
- [ ] Endpoint para comparación de precios entre listas
- [ ] Persistir órdenes en BD
- [ ] Migrar store a API calls

**IMPORTANTE - Naming:** Usamos prefijo `supplier_` en tablas de órdenes y productos porque
el CRM eventualmente tendrá `orders` del lado de Loyverse/POS (órdenes de clientes en el
restaurante). Sin el prefijo habría conflicto de nombres. Las entidades de Loyverse ya usan
el prefijo `loyverse_` (`loyverse_receipts`, `loyverse_shifts`, etc.).

**Nota:** Este módulo es más complejo que recetas por el manejo de archivos Excel y la
cantidad de productos (miles de filas). Considerar paginación server-side.

---

## Fase 3: Autenticación
**Complejidad: Media** | Dependencia: Fase 0

**Estado actual:** JWT via Devise en Rails. Frontend guarda token en localStorage.

**Qué hacer:**
- [ ] Decidir estrategia: JWT propio o sesiones con `nuxt-auth-utils`
- [ ] Implementar login/logout en server routes
- [ ] Middleware de autenticación en Nitro (`server/middleware/auth.ts`)
- [ ] Helper `requireAuth()` para proteger endpoints
- [ ] Migrar `useAuth` composable
- [ ] Verificar que el frontend sigue funcionando igual

**Consideraciones:**
- La tabla `users` ya existe en PostgreSQL (creada por Rails/Devise)
- Los passwords están hasheados con bcrypt (compatible con `bcryptjs` de Node.js)
- Necesitamos leer `users` con Drizzle pero NO modificar la estructura
- La tabla `jwt_denylists` se puede reusar o reemplazar según la estrategia

---

## Fase 4: Nómina (Payroll)
**Complejidad: MUY ALTA** | Dependencia: Fase 3

**Estado actual:** 3 tablas en Rails (employees, weeks, days), cálculos complejos
en PayrollCalculator. Módulo 100% funcional en producción.

**Qué hacer:**
- [ ] Schema Drizzle para `payroll_employees`, `payroll_weeks`, `payroll_days` (tablas existentes)
- [ ] Portar `PayrollCalculator` completo a TypeScript (server-side)
  - Cálculo de horas trabajadas (manejo medianoche)
  - Distribución: regular, overtime tier1, overtime tier2
  - Umbral 20 min para overtime
  - Force overtime
  - Shift rate (tarifa fija por turno)
- [ ] Server routes CRUD para employees, weeks, schedule updates
- [ ] Auto-creación de 7 PayrollDays al crear PayrollWeek
- [ ] Recálculo automático de totales (cascada: day → week)
- [ ] Import/Export endpoints

**Nota:** Ya existe `payrollCalculations.ts` en el frontend. Evaluar si se puede reusar
en server-side (lógica compartida en `shared/` o duplicar en server).

---

## Estructura de Archivos del Server

```
server/
├── api/
│   ├── auth/
│   │   ├── login.post.ts
│   │   ├── logout.delete.ts
│   │   └── me.get.ts
│   ├── recipes/
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   ├── [id].get.ts
│   │   ├── [id].patch.ts
│   │   └── [id].delete.ts
│   ├── suppliers/
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   ├── [id].get.ts
│   │   ├── price-lists/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts        # Upload Excel
│   │   │   ├── [id].get.ts
│   │   │   └── [id].delete.ts
│   │   ├── orders/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [id].get.ts
│   │   └── compare.get.ts           # Comparar precios entre listas
│   └── payroll/
│       ├── employees/
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   ├── [id].patch.ts
│       │   ├── [id].delete.ts
│       │   └── import.post.ts
│       └── weeks/
│           ├── index.get.ts          # ?employee_id=X
│           ├── index.post.ts
│           ├── [id].get.ts
│           ├── [id].patch.ts
│           └── [id]/
│               └── schedule.patch.ts
├── database/
│   ├── index.ts                      # Conexión Drizzle
│   ├── schema/
│   │   ├── users.ts                  # Tabla existente (read-only)
│   │   ├── recipes.ts                # Tabla nueva
│   │   ├── suppliers.ts              # Tablas nuevas (supplier_*)
│   │   └── payroll.ts                # Tablas existentes
│   └── migrations/                   # Solo para tablas nuevas
├── utils/
│   ├── db.ts                         # Helper de conexión
│   ├── auth.ts                       # Middleware/helper de auth
│   ├── validate.ts                   # Wrapper de Zod para H3
│   └── errors.ts                     # Error handling estandarizado
├── services/
│   └── payrollCalculator.ts          # Port del PayrollCalculator de Rails
├── middleware/
│   └── auth.ts                       # Server middleware JWT/session
└── routes/
    └── api/v1/[...].ts               # Proxy catch-all a Rails (temporal)
```

---

## Estrategia de Proxy

Durante la migración, los endpoints no migrados se proxean a Rails:

```typescript
// server/routes/api/v1/[...].ts (catch-all proxy)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = event.path
  return proxyRequest(event, `${config.railsApiUrl}${path}`)
})
```

**Flujo:**
1. Request llega a Nuxt
2. Si existe server route local → la usa
3. Si no → proxy catch-all la reenvía a Rails
4. Conforme migramos módulos, el proxy maneja menos endpoints
5. Cuando auth y payroll estén migrados → eliminamos el proxy y el backend Rails

**Nota sobre rutas:**
- Server routes nuevas de Nuxt usan `/api/` (sin v1)
- El proxy captura `/api/v1/*` y reenvía a Rails
- Al migrar cada módulo, actualizamos los composables del frontend para usar `/api/`

---

## Variables de Entorno

```env
# Base de datos (compartida con Rails)
DATABASE_URL=postgresql://user:pass@host:5432/balconcito_production

# Proxy a Rails (mientras dure la migración)
RAILS_API_URL=https://balconcito-backend.example.com

# Auth (por definir en Fase 3)
JWT_SECRET=...  # Mismo que usa Rails para compatibilidad durante migración
```

---

## Consideraciones Importantes

### Base de Datos Compartida
- **Dev y prod:** Misma instancia PostgreSQL que usa Rails
- **NO modificar tablas existentes** de Rails (users, payroll_*)
- **Tablas nuevas** (recipes, supplier_*) se crean con migraciones Drizzle
- Rails y Nuxt coexistirán accediendo a la misma BD durante la migración

### Compatibilidad de Datos
- Rails usa `snake_case` en BD → Drizzle mapea a `camelCase` en TypeScript
- Los timestamps de Rails (`created_at`, `updated_at`) se respetan
- bcrypt hashes de Devise son compatibles con `bcryptjs` de Node.js

### Rollback
- Si un módulo falla, reactivamos el proxy para esos endpoints
- El proxy es la red de seguridad durante toda la migración

---

## Checklist por Módulo Migrado

Al completar cada módulo:
- [ ] Schema Drizzle coincide con la tabla existente (o tabla nueva creada)
- [ ] Server routes implementadas con validación Zod
- [ ] Composable/store del frontend actualizado para usar nueva API
- [ ] Probado contra la misma BD
- [ ] Proxy removido para ese grupo de endpoints (si aplicaba)
- [ ] Documentado en este archivo (marcar como completado)

---

## Progreso

| Fase | Módulo | Estado | Fecha |
|------|--------|--------|-------|
| 0 | Setup Base (Drizzle + Proxy) | Pendiente | - |
| 1 | Recetas | Pendiente | - |
| 2 | Proveedores | Pendiente | - |
| 3 | Autenticación | Pendiente | - |
| 4 | Nómina | Pendiente | - |
| - | *Apagar backend Rails* | - | - |
