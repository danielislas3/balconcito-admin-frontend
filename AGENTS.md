# AGENTS.md

This file provides guidance for agentic coding agents working in this repository.

## Commands

### Development
```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
```

**IMPORTANT**: Always run `pnpm lint` and `pnpm typecheck` after making changes to ensure code quality.

## Code Style Guidelines

### ESLint Configuration
- Uses `@nuxt/eslint` with stylistic config
- No comma dangle (`commaDangle: 'never'`)
- 1TBS brace style (`braceStyle: '1tbs'`)
- Multiple template roots allowed
- Max 3 attributes per line for single-line elements

### Import Organization
```typescript
// 1. External libraries (Vue, Nuxt, etc.)
import { ref, computed } from 'vue'
import { defineNuxtConfig } from 'nuxt'

// 2. Internal composables
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

// 3. Internal utilities
import { handleApiError } from '~/utils/errorHandler'
```

### TypeScript Conventions
- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use `const` assertions for readonly objects
- Use Zod for runtime validation

### Naming Conventions
- **Components**: PascalCase (e.g., `MetricCard.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `usePayrollApi`)
- **Stores**: camelCase with `Store` suffix (e.g., `useAuthStore`)
- **Utilities**: camelCase (e.g., `formatCurrency`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `OVERTIME_MULTIPLIER`)

### File Organization
```
app/
├── components/          # Vue components
│   └── feature/         # Feature-specific components
│       ├── atoms/       # Small, reusable elements
│       ├── molecules/   # Combinations of atoms
│       └── organisms/   # Complex feature sections
├── composables/         # Vue composables
├── stores/             # Pinia stores
├── pages/              # File-based routing
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## Error Handling

### API Errors
Always use the centralized error handling system:

```typescript
import { handleApiError, isApiError } from '~/utils/errorHandler'

try {
  // API call
} catch (error) {
  if (isApiError(error)) {
    handleApiError(error, 'contextName')
  }
}
```

### Error Types
```typescript
interface ApiError {
  status: number | null
  message: string | null
  data?: any
}
```

## State Management Pattern

### Pinia Store Structure
```typescript
export const useFeatureStore = defineStore('feature', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)
  
  // Getters (computed)
  const itemsCount = computed(() => items.value.length)
  
  // Actions
  const fetchItems = async () => {
    loading.value = true
    try {
      const response = await useFeatureApi().getItems()
      items.value = response.data
    } catch (error) {
      handleApiError(error, 'fetchItems')
    } finally {
      loading.value = false
    }
  }
  
  return {
    items,
    loading,
    itemsCount,
    fetchItems
  }
})
```

### API Layer Pattern
```typescript
// Domain-specific API composable
export const useFeatureApi = () => {
  const api = useApi()
  
  return {
    getItems: () => api.get('/items'),
    createItem: (data: CreateItemDto) => api.post('/items', data),
    updateItem: (id: string, data: UpdateItemDto) => api.patch(`/items/${id}`, data),
    deleteItem: (id: string) => api.delete(`/items/${id}`)
  }
}
```

## Component Guidelines

### Nuxt UI First
Always prefer Nuxt UI components over custom implementations:
- Use `UCard` instead of custom card divs
- Use `UButton` instead of custom buttons
- Use `UTabs` instead of custom tabs
- Use `UDashboardPanel` for page layouts

### Dark Mode Support
All components must support dark mode:
```vue
<template>
  <UCard class="hover:shadow-md transition-shadow">
    <!-- Content -->
  </UCard>
</template>
```

### Semantic Colors
Use colors that convey meaning:
```vue
<!-- Success states -->
<UBadge color="success" variant="subtle">Completado</UBadge>

<!-- Error states -->
<UBadge color="error" variant="subtle">Error</UBadge>

<!-- Warning states -->
<UBadge color="warning" variant="subtle">Pendiente</UBadge>
```

### Numeric Values
Always use `tabular-nums` for numeric values:
```vue
<span class="text-2xl font-bold tabular-nums">$1,234.56</span>
```

## Authentication Pattern

### Protected Routes
```vue
<script setup>
definePageMeta({
  middleware: ['auth'],
  requiresAuth: true
})
</script>
```

### API Client
The base `useApi()` composable automatically:
- Injects auth tokens from localStorage
- Handles 401 responses with auto-logout
- Applies 10-second timeout to all requests

## Testing

### Running Tests
Currently no test framework is configured. When adding tests:
1. Check for existing test setup in package.json
2. Follow the same patterns as existing tests
3. Use the appropriate test runner command

## Business Domain Context

### Language
The application is in Spanish and serves a Mexican restaurant business. All user-facing text should be in Spanish.

### Key Concepts
- **Cuentas**: Money accounts (Mercado Pago, Bóveda, Caja Chica)
- **Gastos**: Business expenses with categories
- **Cierres**: Daily sales closures from Loyverse POS
- **Reembolsos**: Personal card reimbursements
- **Nómina**: Employee payroll management

### Financial Metrics
- **Utilidad Neta**: Net profit
- **Margen Neto**: Net margin percentage
- **COGS %**: Cost of goods sold percentage (target: 25-35%)
- **Punto de Equilibrio**: Break-even point

## Before Committing

1. Run `pnpm lint` - Fix any ESLint errors
2. Run `pnpm typecheck` - Fix any TypeScript errors
3. Test the functionality manually
4. Ensure dark mode works correctly
5. Verify responsive design on mobile

## Common Patterns

### Loading States
```vue
<template>
  <div v-if="loading">
    <USkeleton class="h-8 w-48" />
  </div>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### Form Fields
```vue
<UFormField label="Nombre" required>
  <UInput v-model="name" placeholder="Ingresa el nombre" />
</UFormField>
```

### Grid Layout
```vue
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <!-- Cards -->
</div>
```

## Resources

- [Nuxt UI Documentation](https://ui.nuxt.com)
- [Nuxt 4 Documentation](https://nuxt.com)
- [Pinia Documentation](https://pinia.vuejs.org)
- [Design System](./DESIGN_SYSTEM.md)