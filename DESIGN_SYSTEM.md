# Balconcito Design System

Guía de diseño unificada para el frontend de Balconcito ERP. Este documento establece los patrones, colores, componentes y lineamientos para mantener una UI consistente en toda la aplicación.

## Principios de Diseño

1. **Consistencia**: Usar los mismos patrones y componentes en toda la aplicación
2. **Semántica de colores**: Los colores transmiten significado
3. **Nuxt UI First**: Preferir componentes de Nuxt UI sobre implementaciones custom
4. **Dark Mode First**: Tema oscuro como default, todos los componentes deben soportarlo
5. **Responsive**: Mobile-first, con adaptaciones para desktop

---

## Paleta de Colores Balconcito

**Estilo**: Cálido/Acogedor
**Tema base**: Oscuro
**Archivo de configuración**: `app/assets/css/theme-balconcito.css`

### Colores del Sistema (Nuxt UI)

Configurados en `app.config.ts`, usan la paleta de Tailwind:

| Token | Color Tailwind | Uso |
|-------|----------------|-----|
| `primary` | orange | CTAs, navegación activa, marca |
| `secondary` | teal | Acciones secundarias, acentos |
| `success` | lime | Éxito, confirmaciones |
| `info` | sky | Información, ayuda |
| `warning` | amber | Advertencias, pendientes |
| `error` | red | Errores, destructivos |
| `neutral` | stone | Texto, bordes, fondos (gris cálido) |

### Colores Semánticos del Negocio

Definidos en `theme-balconcito.css`, con clases utility listas para usar:

| Contexto | Clase CSS | Variable CSS | Uso |
|----------|-----------|--------------|-----|
| **Dinero/Pagos** | `.text-money`, `.bg-money` | `--balconcito-money` | Totales, salarios, saldos |
| **Horas/Tiempo** | `.text-hours`, `.bg-hours` | `--balconcito-hours` | Horas trabajadas |
| **Overtime 1.5x** | `.text-overtime-1`, `.bg-overtime-1` | `--balconcito-overtime-1` | Horas extra tier 1 |
| **Overtime 2x** | `.text-overtime-2`, `.bg-overtime-2` | `--balconcito-overtime-2` | Horas extra tier 2 |
| **Ingresos** | `.text-income`, `.bg-income` | `--balconcito-income` | Ventas, ganancias |
| **Gastos** | `.text-expense`, `.bg-expense` | `--balconcito-expense` | Egresos, pérdidas |
| **Cuentas** | `.text-accounts`, `.bg-accounts` | `--balconcito-accounts` | Saldos de cuentas |

### Cómo Cambiar Colores

**Cambiar colores base (Nuxt UI):**
Edita `app.config.ts`:
```ts
colors: {
  primary: 'orange',  // Cambiar a 'red', 'blue', etc.
  secondary: 'teal',
  // ...
}
```

**Cambiar colores semánticos del negocio:**
Edita `theme-balconcito.css`:
```css
:root {
  --balconcito-money: theme('colors.violet.600');
  /* Cambiar a otro color de Tailwind */
}
```

### Usando los Colores

```vue
<!-- Nuxt UI components (recomendado) -->
<UButton color="primary">Guardar</UButton>
<UBadge color="warning">Pendiente</UBadge>

<!-- Clases Tailwind estándar -->
<div class="bg-orange-500 text-white">Primary</div>
<span class="text-amber-500">Warning</span>

<!-- Clases semánticas de negocio -->
<span class="text-money">$1,234.00</span>
<div class="bg-income text-income">+$500</div>
<div class="bg-expense text-expense">-$200</div>
```

---

## Componentes de Nuxt UI

### Layout Dashboard

**SIEMPRE** usar los componentes de dashboard de Nuxt UI para páginas principales:

```vue
<template>
  <UDashboardPanel id="page-name">
    <template #header>
      <UDashboardNavbar title="Título de Página">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Acciones -->
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- Filtros, selectores -->
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Contenido -->
    </template>
  </UDashboardPanel>
</template>
```

### Cards

Usar `UCard` con variantes apropiadas:

```vue
<!-- Card estándar -->
<UCard>
  <template #header>Título</template>
  Contenido
  <template #footer>Acciones</template>
</UCard>

<!-- Card sutil para métricas -->
<UCard variant="subtle">
  <!-- Contenido de métrica -->
</UCard>

<!-- Card destacada con gradiente (usar sparingly) -->
<UCard class="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
  <!-- Contenido importante -->
</UCard>
```

### Botones

```vue
<!-- Primario -->
<UButton color="primary">Acción Principal</UButton>

<!-- Secundario -->
<UButton color="neutral" variant="soft">Acción Secundaria</UButton>

<!-- Ghost -->
<UButton color="neutral" variant="ghost">Acción Terciaria</UButton>

<!-- Con icono -->
<UButton icon="i-lucide-plus" label="Nuevo" />

<!-- Solo icono (mobile) -->
<UButton icon="i-lucide-plus" class="lg:hidden" />
<UButton icon="i-lucide-plus" label="Nuevo Elemento" class="hidden lg:flex" />
```

### Badges

```vue
<!-- Estados de salud -->
<UBadge color="success" variant="subtle">Saludable</UBadge>
<UBadge color="warning" variant="subtle">Atención</UBadge>
<UBadge color="error" variant="subtle">Crítico</UBadge>

<!-- Información -->
<UBadge color="info" variant="subtle">5 pendientes</UBadge>
```

### Tabs

Usar `UTabs` de Nuxt UI en lugar de tabs custom:

```vue
<script setup>
const tabs = [
  { label: 'Horarios', icon: 'i-lucide-calendar', value: 'schedules' },
  { label: 'Mensual', icon: 'i-lucide-calendar-range', value: 'monthly' },
  { label: 'Reportes', icon: 'i-lucide-bar-chart-3', value: 'reports' }
]
</script>

<template>
  <UTabs :items="tabs" v-model="activeTab" />
</template>
```

---

## Patrones de Componentes

### Metric Card (Patrón Estándar)

Para mostrar métricas/KPIs:

```vue
<template>
  <UCard variant="subtle" class="hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-muted">{{ label }}</span>
      <UIcon :name="icon" class="size-5" :class="iconColorClass" />
    </div>
    <div class="text-2xl font-bold tabular-nums" :class="valueColorClass">
      {{ formattedValue }}
    </div>
    <div v-if="subtitle" class="text-xs text-muted mt-1">
      {{ subtitle }}
    </div>
  </UCard>
</template>
```

### Grid de Métricas

```vue
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard
    label="Ingresos"
    :value="income"
    icon="i-lucide-trending-up"
    color="green"
  />
  <!-- más cards -->
</div>
```

### Sección con Título

```vue
<section class="space-y-4">
  <h2 class="text-lg font-semibold">Título de Sección</h2>
  <!-- contenido -->
</section>
```

---

## Tipografía

### Jerarquía

| Elemento | Clases | Uso |
|----------|--------|-----|
| Título de página | `text-xl font-semibold` | En `UDashboardNavbar` |
| Título de sección | `text-lg font-semibold` | Encabezados de sección |
| Título de card | `text-base font-semibold` | Headers de `UCard` |
| Etiqueta | `text-sm font-medium text-muted` | Labels de campos |
| Valor grande | `text-2xl font-bold tabular-nums` | Métricas principales |
| Valor mediano | `text-lg font-semibold tabular-nums` | Métricas secundarias |
| Texto descriptivo | `text-sm text-muted` | Descripciones, ayuda |
| Texto pequeño | `text-xs text-muted` | Notas, metadata |

### Números Tabulares

**SIEMPRE** usar `tabular-nums` para valores numéricos para mantener alineación:

```vue
<span class="tabular-nums">$12,345.00</span>
```

---

## Espaciado

### Entre Secciones

```vue
<div class="space-y-8">
  <section>...</section>
  <section>...</section>
</div>
```

### Grid Gaps

```vue
<!-- Cards de métricas -->
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

<!-- Elementos compactos -->
<div class="flex gap-2">

<!-- Cards grandes -->
<div class="grid gap-6 lg:grid-cols-2">
```

### Padding de Cards

Los `UCard` manejan el padding automáticamente. No agregar padding extra innecesario.

---

## Responsive Design

### Breakpoints

| Breakpoint | Uso |
|------------|-----|
| Default | Mobile first |
| `sm:` (640px) | Tablets pequeñas |
| `lg:` (1024px) | Desktop |

### Patrones Comunes

```vue
<!-- Ocultar en mobile, mostrar en desktop -->
<div class="hidden lg:block">

<!-- Mostrar en mobile, ocultar en desktop -->
<div class="lg:hidden">

<!-- Grid responsivo -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

<!-- Botón: solo icono en mobile, con label en desktop -->
<UButton icon="i-lucide-plus" class="lg:hidden" />
<UButton icon="i-lucide-plus" label="Nuevo" class="hidden lg:flex" />
```

---

## Estados de Loading

### Skeleton

```vue
<template>
  <div v-if="loading">
    <USkeleton class="h-8 w-48" />
    <USkeleton class="h-4 w-32 mt-2" />
  </div>
  <div v-else>
    <!-- contenido -->
  </div>
</template>
```

### Loading Overlay (Solo cuando es necesario)

```vue
<Transition>
  <div v-if="loading" class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
    <UCard class="p-8">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      <p class="mt-4 text-muted">Cargando...</p>
    </UCard>
  </div>
</Transition>
```

---

## Animaciones y Transiciones

### Transiciones Estándar

```vue
<!-- Hover en cards -->
class="hover:shadow-md transition-shadow"

<!-- Hover en botones (ya incluido en UButton) -->
class="transition-all duration-200"

<!-- Scale sutil (usar con moderación) -->
class="hover:scale-[1.02] transition-transform"
```

### Evitar

- ❌ `animate-spin` en elementos que no sean spinners
- ❌ `scale-105` o mayor (demasiado dramático)
- ❌ Animaciones complejas sin propósito funcional
- ❌ Transiciones largas (>300ms)

---

## Iconos

Usar Lucide icons (`i-lucide-*`):

| Contexto | Icono |
|----------|-------|
| Agregar | `i-lucide-plus` |
| Editar | `i-lucide-pencil` |
| Eliminar | `i-lucide-trash-2` |
| Guardar | `i-lucide-check` |
| Cancelar | `i-lucide-x` |
| Configuración | `i-lucide-settings` |
| Usuario | `i-lucide-user` |
| Calendario | `i-lucide-calendar` |
| Dinero | `i-lucide-banknote` |
| Gráfica | `i-lucide-bar-chart-3` |
| Tendencia arriba | `i-lucide-trending-up` |
| Tendencia abajo | `i-lucide-trending-down` |
| Alerta | `i-lucide-alert-circle` |
| Info | `i-lucide-info` |
| Éxito | `i-lucide-check-circle` |
| Reloj | `i-lucide-clock` |

---

## Formularios

### Campos con Label

```vue
<UFormField label="Nombre" required>
  <UInput v-model="name" placeholder="Ingresa el nombre" />
</UFormField>
```

### Grids de Formularios

```vue
<div class="grid gap-4 sm:grid-cols-2">
  <UFormField label="Campo 1">
    <UInput v-model="field1" />
  </UFormField>
  <UFormField label="Campo 2">
    <UInput v-model="field2" />
  </UFormField>
</div>
```

---

## Checklist para Nuevos Componentes

Antes de crear un componente, verificar:

- [ ] ¿Existe un componente de Nuxt UI que cubra esta necesidad?
- [ ] ¿Se puede extender un componente existente con el prop `ui`?
- [ ] ¿Soporta dark mode correctamente?
- [ ] ¿Es responsive (mobile-first)?
- [ ] ¿Usa colores semánticos del sistema?
- [ ] ¿Usa `tabular-nums` para valores numéricos?
- [ ] ¿Sigue la jerarquía tipográfica establecida?

---

## Migración del Módulo Payroll

El módulo de payroll actualmente usa estilos custom que difieren del resto de la app. Para unificar:

### Cambios Prioritarios

1. **Reemplazar header custom** por `UDashboardNavbar`
2. **Reemplazar tabs custom** por `UTabs`
3. **Cambiar `emerald-*`** por `primary` (green) para consistencia
4. **Simplificar gradientes** - usar solo donde agreguen valor
5. **Usar `UCard`** en lugar de divs con clases de card custom

### Mantener

- Sistema de colores semánticos para métricas (violet=dinero, blue=horas, etc.)
- Cards de estadísticas con iconos
- Patrones responsive actuales

### Ejemplo de Migración

**Antes (Custom):**
```vue
<div class="bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-700">
  <h1 class="text-3xl font-bold text-white">Sistema de Nóminas</h1>
</div>
```

**Después (Nuxt UI):**
```vue
<UDashboardNavbar title="Sistema de Nóminas">
  <template #leading>
    <UDashboardSidebarCollapse />
  </template>
</UDashboardNavbar>
```

---

## Recursos

- [Nuxt UI Documentation](https://ui.nuxt.com)
- [Lucide Icons](https://lucide.dev/icons)
- [Tailwind CSS](https://tailwindcss.com/docs)
