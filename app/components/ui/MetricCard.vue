<script setup lang="ts">
/**
 * MetricCard - Componente reutilizable para mostrar métricas/KPIs
 *
 * Sigue el Design System de Balconcito:
 * - Usa UCard como base
 * - Colores semánticos para diferentes tipos de métricas
 * - Soporte completo para dark mode
 * - Responsive por defecto
 *
 * Colores disponibles:
 * - primary: Acciones principales (orange)
 * - money: Totales de pago, salarios (violet)
 * - hours: Horas trabajadas (sky)
 * - overtime-1: Horas extra 1.5x (amber)
 * - overtime-2: Horas extra 2x (red)
 * - income: Ingresos (lime)
 * - expense: Gastos (red)
 * - accounts: Saldos de cuentas (teal)
 * - neutral: Información general (stone)
 */

type MetricColor = 'primary' | 'money' | 'hours' | 'overtime-1' | 'overtime-2' | 'income' | 'expense' | 'accounts' | 'neutral'
type MetricSize = 'sm' | 'md' | 'lg'

interface Props {
  label: string
  value: string | number
  icon?: string
  color?: MetricColor
  size?: MetricSize
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'md',
  loading: false
})

// Color mappings usando la paleta Balconcito
const colorClasses = computed(() => {
  const colorMap: Record<MetricColor, { bg: string, text: string, icon: string }> = {
    'primary': {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-500 dark:text-orange-400'
    },
    'money': {
      bg: 'bg-money',
      text: 'text-money',
      icon: 'text-money'
    },
    'hours': {
      bg: 'bg-hours',
      text: 'text-hours',
      icon: 'text-hours'
    },
    'overtime-1': {
      bg: 'bg-overtime-1',
      text: 'text-overtime-1',
      icon: 'text-overtime-1'
    },
    'overtime-2': {
      bg: 'bg-overtime-2',
      text: 'text-overtime-2',
      icon: 'text-overtime-2'
    },
    'income': {
      bg: 'bg-income',
      text: 'text-income',
      icon: 'text-income'
    },
    'expense': {
      bg: 'bg-expense',
      text: 'text-expense',
      icon: 'text-expense'
    },
    'accounts': {
      bg: 'bg-accounts',
      text: 'text-accounts',
      icon: 'text-accounts'
    },
    'neutral': {
      bg: 'bg-stone-50 dark:bg-stone-800/50',
      text: 'text-stone-700 dark:text-stone-300',
      icon: 'text-stone-500 dark:text-stone-400'
    }
  }
  return colorMap[props.color]
})

// Size mappings
const sizeClasses = computed(() => {
  const sizeMap: Record<MetricSize, { value: string, label: string, icon: string }> = {
    sm: {
      value: 'text-lg font-semibold',
      label: 'text-xs',
      icon: 'size-4'
    },
    md: {
      value: 'text-2xl font-bold',
      label: 'text-sm',
      icon: 'size-5'
    },
    lg: {
      value: 'text-3xl font-bold',
      label: 'text-base',
      icon: 'size-6'
    }
  }
  return sizeMap[props.size]
})

// Trend icon
const trendIcon = computed(() => {
  if (!props.trend) return null
  return props.trend === 'up'
    ? 'i-lucide-trending-up'
    : props.trend === 'down'
      ? 'i-lucide-trending-down'
      : 'i-lucide-minus'
})

const trendColor = computed(() => {
  if (!props.trend) return ''
  return props.trend === 'up'
    ? 'text-green-600 dark:text-green-400'
    : props.trend === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400'
})
</script>

<template>
  <UCard
    variant="subtle"
    :class="[colorClasses.bg, 'hover:shadow-md transition-shadow duration-200']"
  >
    <!-- Loading State -->
    <template v-if="loading">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="size-5 rounded" />
        </div>
        <USkeleton class="h-8 w-28" />
        <USkeleton v-if="subtitle" class="h-3 w-24" />
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <!-- Header: Label + Icon -->
      <div class="flex items-center justify-between mb-2">
        <span :class="[sizeClasses.label, 'font-medium text-muted']">
          {{ label }}
        </span>
        <UIcon
          v-if="icon"
          :name="icon"
          :class="[sizeClasses.icon, colorClasses.icon]"
        />
      </div>

      <!-- Value -->
      <div :class="[sizeClasses.value, colorClasses.text, 'tabular-nums']">
        {{ value }}
      </div>

      <!-- Subtitle or Trend -->
      <div v-if="subtitle || trend" class="mt-1 flex items-center gap-2">
        <span v-if="subtitle" class="text-xs text-muted">
          {{ subtitle }}
        </span>
        <div v-if="trend" :class="['flex items-center gap-1 text-xs', trendColor]">
          <UIcon :name="trendIcon!" class="size-3" />
          <span v-if="trendValue">{{ trendValue }}</span>
        </div>
      </div>
    </template>
  </UCard>
</template>
