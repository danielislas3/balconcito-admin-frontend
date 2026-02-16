<script setup lang="ts">
import html2canvas from 'html2canvas-pro'
import type { PayrollWeek } from '~/types/payroll'
import type { Currency } from '~/utils/payrollConstants'
import { calculateWeekTotals } from '~/utils/payrollCalculations'
import { formatCurrency as formatCurrencyUtil, formatWeekDisplay } from '~/utils/payrollFormatters'
import { WEEK_DAYS } from '~/utils/payrollConstants'
import { generateWeeklySummaryText } from '~/utils/payrollShareFormatter'
import { useClipboard } from '@vueuse/core'

export interface WeekSummaryCompactProps {
  week: PayrollWeek
  employeeName: string
  currency?: string
}

const props = defineProps<WeekSummaryCompactProps>()
const toast = useToast()

const formatCurrency = (amount: number) => {
  return formatCurrencyUtil(amount, (props.currency || 'MXN') as Currency)
}

// Copiar texto para WhatsApp
const { copy } = useClipboard()
const justCopiedText = ref(false)

const copyText = async () => {
  if (!props.week) return
  const text = generateWeeklySummaryText(props.week, props.employeeName, (props.currency || 'MXN') as Currency)
  await copy(text)
  justCopiedText.value = true
  toast.add({ title: 'Texto copiado', description: 'Pega en WhatsApp', color: 'success' })
  setTimeout(() => {
    justCopiedText.value = false
  }, 2000)
}

// Compartir como imagen
const shareCardRef = ref<HTMLElement | null>(null)
const sharing = ref(false)

const shareAsImage = async () => {
  if (!shareCardRef.value || sharing.value) return
  sharing.value = true

  try {
    const canvas = await html2canvas(shareCardRef.value, {
      backgroundColor: '#1c1917',
      scale: 2,
      useCORS: true
    })

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png')
    )

    if (!blob) throw new Error('No se pudo generar la imagen')

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

    if (isMobile) {
      const file = new File([blob], `resumen-${props.employeeName}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Resumen - ${props.employeeName}` })
        return
      }
    }

    // Desktop: copiar imagen al clipboard
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    toast.add({ title: 'Imagen copiada', description: 'Pega con Ctrl+V en WhatsApp Web', color: 'success' })
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      toast.add({ title: 'Error al compartir', color: 'error' })
    }
  } finally {
    sharing.value = false
  }
}

const weekTotals = computed(() => {
  if (!props.week) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      extraHours: 0,
      totalBasePay: 0,
      totalPay: 0,
      totalShifts: 0,
      totalOvertimeHours: 0
    }
  }
  return calculateWeekTotals(props.week)
})
</script>

<template>
  <div class="space-y-2">
    <!-- Botones de compartir -->
    <div class="flex items-center justify-end gap-1">
      <UButton
        :icon="justCopiedText ? 'i-lucide-check' : 'i-lucide-clipboard'"
        :color="justCopiedText ? 'success' : 'neutral'"
        variant="ghost"
        size="xs"
        label="Texto"
        @click="copyText"
      />
      <UButton
        :icon="sharing ? 'i-lucide-loader-2' : 'i-lucide-share'"
        color="neutral"
        variant="ghost"
        size="xs"
        label="Imagen"
        :disabled="sharing"
        :loading="sharing"
        @click="shareAsImage"
      />
    </div>

    <!-- Card capturablecomo imagen -->
    <div ref="shareCardRef" class="rounded-xl overflow-hidden">
      <div class="bg-stone-900 p-3 space-y-2">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="text-sm font-bold text-white">
            {{ employeeName }}
          </div>
          <div class="text-xs text-stone-400">
            {{ formatWeekDisplay(week.startDate) }}
          </div>
        </div>

        <!-- Días trabajados -->
        <div v-if="week && week.schedule" class="space-y-0.5">
          <div
            v-for="day in WEEK_DAYS"
            v-show="week.schedule[day.key]?.hoursWorked > 0"
            :key="day.key"
            class="flex items-center justify-between py-1 px-2 rounded bg-stone-800"
          >
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <span class="text-xs">{{ day.emoji }}</span>
              <span class="text-xs font-medium text-stone-300 w-16">{{ day.name }}</span>
              <span class="text-[11px] text-stone-500">
                {{ week.schedule[day.key]?.hoursWorked.toFixed(1) }}h
              </span>
            </div>
            <span class="text-xs font-semibold text-white tabular-nums">
              {{ formatCurrency(week.schedule[day.key]?.dailyPay || 0) }}
            </span>
          </div>
        </div>

        <!-- Totales -->
        <div v-if="week" class="pt-1 border-t border-stone-700 space-y-1">
          <div class="flex justify-between text-xs text-stone-400">
            <span>{{ weekTotals.totalHours.toFixed(1) }}h trabajadas</span>
            <span>Base: {{ formatCurrency(weekTotals.totalBasePay) }}</span>
          </div>
          <div v-if="week.weeklyTips > 0" class="flex justify-between text-xs text-amber-500">
            <span>Propinas</span>
            <span>+ {{ formatCurrency(week.weeklyTips) }}</span>
          </div>
          <div class="flex justify-between items-center pt-1 px-2 py-1.5 bg-orange-950/50 rounded-lg border border-orange-800">
            <span class="text-xs font-semibold text-orange-300">Total</span>
            <span class="text-base font-bold text-orange-400 tabular-nums">
              {{ formatCurrency(weekTotals.totalPay) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
