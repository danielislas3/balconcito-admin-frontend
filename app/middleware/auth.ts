export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
