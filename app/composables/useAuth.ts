import type { AuthUser } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const toast = useToast()

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      authStore.setUser(response.user)

      toast.add({
        title: '¡Bienvenido!',
        description: `Hola ${response.user.name}`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      return response
    } catch (error: any) {
      toast.add({
        title: 'Error al iniciar sesión',
        description: error.data?.message || 'Credenciales incorrectas',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Best effort — clear local state regardless
    }

    authStore.clearUser()

    toast.add({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente',
      color: 'info',
      icon: 'i-lucide-log-out'
    })

    navigateTo('/login')
  }

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/me')
      authStore.setUser(response.user)
      return true
    } catch {
      authStore.clearUser()
      return false
    }
  }

  return {
    login,
    logout,
    checkAuth,
    user: computed(() => authStore.currentUser),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userRole: computed(() => authStore.userRole)
  }
}
