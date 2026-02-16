// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'dayjs-nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Dark mode como default
  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    railsApiUrl: process.env.NUXT_RAILS_API_URL || 'http://localhost:3001/api/v1',
    jwtSecret: process.env.NUXT_JWT_SECRET || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api/v1'
    }
  },

  compatibilityDate: '2024-11-01',

  dayjs: {
    locales: ['es'],
    defaultLocale: 'es',
    plugins: ['duration', 'isSameOrBefore', 'isSameOrAfter', 'customParseFormat']
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
