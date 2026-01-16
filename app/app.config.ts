export default defineAppConfig({
  ui: {
    // ========================================
    // BALCONCITO COLOR PALETTE
    // Naranja/Terracota como primario, tema oscuro
    //
    // Los colores custom están definidos en theme-balconcito.css
    // Aquí mapeamos los nombres de Tailwind a nuestros colores
    // ========================================
    colors: {
      primary: 'orange',     // Naranja/Terracota
      secondary: 'teal',     // Teal oscuro
      success: 'lime',       // Verde cálido
      info: 'sky',           // Azul cálido
      warning: 'amber',      // Ámbar/Dorado
      error: 'red',          // Rojo cálido
      neutral: 'stone'       // Gris cálido
    },
    // Card styling
    card: {
      slots: {
        root: 'rounded-lg overflow-hidden',
        header: 'p-4 sm:px-6',
        body: 'p-4 sm:p-6',
        footer: 'p-4 sm:px-6'
      }
    },
    // Button defaults
    button: {
      defaultVariants: {
        size: 'md'
      }
    },
    // Badge defaults
    badge: {
      defaultVariants: {
        variant: 'subtle'
      }
    }
  }
})
