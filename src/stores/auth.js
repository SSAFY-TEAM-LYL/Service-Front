import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const isRestoring = ref(false)
  let restorePromise = null

  const isLoggedIn = computed(() => !!accessToken.value)

  function setAuth(token, userInfo) {
    accessToken.value = token
    user.value = userInfo
    localStorage.setItem('accessToken', token)
  }

  function clearAuth() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data.token, data.user)
    return data
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload)
    setAuth(data.token, data.user)
    return data
  }

  async function restoreUser() {
    if (user.value) return user.value
    if (!accessToken.value) {
      clearAuth()
      return null
    }
    if (restorePromise) return restorePromise

    isRestoring.value = true
    restorePromise = api
      .get('/auth/me', { skipAuthRedirect: true })
      .then(({ data }) => {
        user.value = data
        return data
      })
      .catch((error) => {
        clearAuth()
        throw error
      })
      .finally(() => {
        isRestoring.value = false
        restorePromise = null
      })

    return restorePromise
  }

  function logout() {
    clearAuth()
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    isRestoring,
    login,
    signup,
    restoreUser,
    logout,
    setAuth,
    clearAuth,
  }
})
