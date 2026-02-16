import { defineStore } from 'pinia'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role)

  function setUser(newUser: AuthUser) {
    user.value = newUser
  }

  function clearUser() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    currentUser,
    userRole,
    setUser,
    clearUser
  }
})
