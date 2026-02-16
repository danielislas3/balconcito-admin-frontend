export const useAuth = () => {
  const authStore = useAuthStore()
  const api = useApi()
  const toast = useToast()

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string, user: { id: number, email: string, name: string, role: string } }>('/auth/login', { email, password })

      // Guardar token y usuario en el store (que los persiste en localStorage)
      authStore.setAuth(response.token, response.user)

      toast.add({
        title: '¡Bienvenido!',
        description: `Hola ${response.user.name}`,
        color: 'green',
        icon: 'i-lucide-check-circle'
      })

      return response
    } catch (error: unknown) {
      const errData = error as { data?: { message?: string } }
      toast.add({
        title: 'Error al iniciar sesión',
        description: errData.data?.message || 'Credenciales incorrectas',
        color: 'red',
        icon: 'i-lucide-alert-circle'
      })
      throw error
    }
  }

  const logout = () => {
    authStore.logout()

    toast.add({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente',
      color: 'blue',
      icon: 'i-lucide-log-out'
    })

    navigateTo('/login')
  }

  const checkAuth = async () => {
    if (!authStore.token) {
      return false
    }

    try {
      const user = await api.get<{ id: number, email: string, name: string, role: string }>('/auth/me')
      authStore.setUser(user)
      return true
    } catch {
      authStore.logout()
      return false
    }
  }

  const getToken = async () => {
    return authStore.token
  }

  return {
    login,
    logout,
    checkAuth,
    getToken,
    user: computed(() => authStore.currentUser),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userRole: computed(() => authStore.userRole)
  }
}
