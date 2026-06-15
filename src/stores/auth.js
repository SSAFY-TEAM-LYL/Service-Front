import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { unwrapApiResponse } from '@/api'

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
    const data = unwrapApiResponse(await api.post('/auth/login', { email, password }))
    setAuth(data.token, data.user)
    return data
  }

  async function signup(payload) {
    const data = unwrapApiResponse(await api.post('/auth/signup', payload))
    setAuth(data.token, data.user)
    return data
  }

  async function exchangeOAuthCode(code) {
    const data = unwrapApiResponse(await api.post('/auth/oauth/exchange', { code }))
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
      .then((response) => {
        const data = unwrapApiResponse(response)
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
    exchangeOAuthCode,
    restoreUser,
    logout,
    setAuth,
    clearAuth,
  }
})
