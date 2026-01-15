# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Balconcito ERP Frontend** - Sistema de administración centralizado para Balconcito, un bar-restaurante en Ciudad de México. La aplicación está en español y es operada por Daniel y Raúl (co-propietarios).

El sistema reemplaza formularios de Google y Excel para:
- Registrar cierres de turno (ventas diarias desde Loyverse POS)
- Registrar gastos del negocio
- Trackear reembolsos (gastos hechos con tarjetas personales)
- Ver métricas financieras en dashboard
- Gestionar nómina de empleados

## Commands

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
```

## Architecture

### Directory Structure

- `app/` - Main application code (Nuxt 4 app directory structure)
  - `composables/` - Vue composables for shared logic
  - `stores/` - Pinia stores for state management
  - `components/` - Vue components organized by feature and atomic design
  - `pages/` - File-based routing
  - `middleware/` - Route middleware (auth protection)
  - `plugins/` - Nuxt plugins (client-side auth initialization)
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions (calculations, formatters, error handling)

### Component Organization

Components follow atomic design within feature folders:
- `components/payroll/atoms/` - Small, reusable elements (StatCard, DayLabel)
- `components/payroll/molecules/` - Combinations of atoms (ScheduleTable, WeekSummaryStats)
- `components/payroll/organisms/` - Complex feature sections (SettingsTab, SchedulesTab)

### State Management Pattern

Pinia stores use the setup syntax and follow a repository pattern:
1. Store defines state, getters (computed), and actions
2. API calls go through domain-specific composables (e.g., `usePayrollApi`)
3. Stores update local state after successful API responses

Example flow:
```
Component -> Store Action -> API Composable -> Backend
                         <- Response
            Update State <-
```

### API Layer

- `useApi()` - Base HTTP client with auth token injection and error handling
- Domain composables (e.g., `usePayrollApi()`) - Typed API methods for specific features
- Auto-logout on 401 responses
- 10-second timeout on all requests
- Error handling through `utils/errorHandler.ts`

### Authentication

- JWT token stored in localStorage (`auth_token`, `auth_user`)
- `useAuthStore` - Pinia store for auth state
- `useAuth()` - Login/logout composable
- `auth.ts` middleware - Route protection
- `auth.client.ts` plugin - Restores session on page load

Protected routes use:
```vue
<script setup>
definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
})
</script>
```

## Business Domain

### Cuentas (Accounts)
Three money accounts that auto-update with transactions:
- **Mercado Pago** - Digital account (transfers + card payments)
- **Bóveda** - Physical cash vault
- **Caja Chica** - Petty cash (always starts with $1,000 MXN fund)

### Expense Categories
COGS (Cost of Goods Sold):
- cerveza, cerveza_barril, vinos_licores, refrescos_jugos, alimentos, desechables, hielo, insumos_secos

Fixed Costs:
- renta, nomina, servicios, gastos_financieros, pago_deuda

Variable Costs:
- mantenimiento, gastos_staff, gastos_varios

### Payment Sources
- efectivo_caja_chica, efectivo_boveda, transferencia_negocio
- tarjeta_negocio, tarjeta_daniel, tarjeta_raul (personal cards require reimbursement)

### Financial Metrics
- **Utilidad Neta** - Net profit (Income - Expenses)
- **Margen Neto** - Net margin percentage
- **COGS %** - Cost of goods sold as percentage of sales (target: 25-35%)
- **Punto de Equilibrio** - Break-even point
- **Cash Runway** - Days of operation without income

## Key Technologies

- **Nuxt 4.2 + Nuxt UI 4.2** - Framework and UI components (U-prefixed)
- **Pinia 3.0** - State management with setup syntax
- **dayjs** - Date manipulation (Spanish locale, duration/customParseFormat plugins)
- **Zod** - Schema validation
- **Unovis** - Data visualization charts
- **VueUse** - Composition utilities
- **@internationalized/date** - Date handling for calendar components

## Configuration

- `app.config.ts` - UI theme (primary: green, neutral: zinc)
- `nuxt.config.ts` - Modules and runtime config
- `.env` - `NUXT_PUBLIC_API_BASE` for backend URL (default: http://localhost:3000/api/v1)

## ESLint Rules

- Uses `@nuxt/eslint` with stylistic config
- No comma dangle, 1TBS brace style
- Multiple template roots allowed
- Max 3 attributes per line (single line)

## Payroll Module

The payroll module (`app/stores/payroll.ts`, `app/composables/usePayrollApi.ts`) manages:
- Employees with configurable hourly rates and overtime settings
- Weekly schedules with entry/exit times
- Automatic calculation of hours worked, overtime (tier 1 and tier 2), and daily pay
- Weekly tips distribution
- Shift-based pay option

Key types in `app/types/payroll.ts`:
- `PayrollEmployee` - Employee with settings and weeks
- `PayrollWeek` - Week with schedule and tips
- `DaySchedule` - Daily entry/exit times with calculated values
- `EmployeeSettings` - Hourly rate, overtime rates, break hours

## Backend API Reference

The Rails backend provides these main endpoints:
- `POST /auth/login` - Authentication
- `GET/PATCH /accounts` - Account balances
- `CRUD /turn_closures` - Daily sales closures
- `CRUD /expenses` - Business expenses
- `GET/POST /reimbursements` - Personal card reimbursements
- `GET /dashboard/*` - Financial metrics (summary, profitability, break_even, cash_flow)
- `CRUD /payroll/employees` - Payroll management

For full API documentation, see the backend repository.

## Design System

**IMPORTANT**: Read `DESIGN_SYSTEM.md` before creating or modifying UI components.

### Core Principles

1. **Nuxt UI First** - Always prefer Nuxt UI components over custom implementations
2. **Use Dashboard Layout** - Pages should use `UDashboardPanel`, `UDashboardNavbar`, `UDashboardToolbar`
3. **Semantic Colors** - Use colors that convey meaning (see below)
4. **Dark Mode Required** - All components must support dark mode

### Paleta de Colores Balconcito

**Tema**: Cálido/Acogedor con tema oscuro como default

| Token | Color Tailwind | Uso |
|-------|----------------|-----|
| `primary` | orange | CTAs, navegación activa, marca |
| `secondary` | teal | Acciones secundarias |
| `success` | lime | Éxito, confirmaciones |
| `info` | sky | Información, horas |
| `warning` | amber | Advertencias, overtime |
| `error` | red | Errores, gastos |
| `neutral` | stone | Texto, fondos (gris cálido) |

### Clases Semánticas de Negocio

Usa estas clases utility para contextos específicos:

| Contexto | Clases | Uso |
|----------|--------|-----|
| Dinero | `.text-money`, `.bg-money` | Salarios, totales |
| Horas | `.text-hours`, `.bg-hours` | Horas trabajadas |
| Overtime 1 | `.text-overtime-1` | Horas extra 1.5x |
| Overtime 2 | `.text-overtime-2` | Horas extra 2x |
| Ingresos | `.text-income`, `.bg-income` | Ventas, ganancias |
| Gastos | `.text-expense`, `.bg-expense` | Egresos |
| Cuentas | `.text-accounts`, `.bg-accounts` | Saldos |

### Reusable Components

- `components/ui/MetricCard.vue` - Standard metric/KPI display card
  - Props: `label`, `value`, `icon`, `color`, `size`, `subtitle`, `trend`, `trendValue`
  - Colors: `primary`, `money`, `hours`, `overtime-1`, `overtime-2`, `income`, `expense`, `accounts`, `neutral`

### Archivos de Tema

- `app/assets/css/theme-balconcito.css` - Variables CSS semánticas y clases utility
- `app.config.ts` - Mapeo de colores Nuxt UI

### MCP Tools Available

Use the Nuxt UI MCP server for component documentation:
- `mcp__nuxt-ui-remote__get-component` - Get component docs and props
- `mcp__nuxt-ui-remote__list-components` - List all available components
- `mcp__nuxt-ui-remote__get-documentation-page` - Get theming docs

### Checklist for New Components

Before creating a component:
- [ ] Check if Nuxt UI has an existing component
- [ ] Read DESIGN_SYSTEM.md patterns
- [ ] Support dark mode with `dark:` classes
- [ ] Use semantic colors from the system
- [ ] Use `tabular-nums` for numeric values
- [ ] Make it responsive (mobile-first)
