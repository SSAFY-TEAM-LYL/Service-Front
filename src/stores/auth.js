import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { unwrapApiResponse } from '@/api'
import { fetchMyProfile, updateMyProfile, withdrawMe } from '@/api/members'

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
    restorePromise = null
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

  async function restoreDeletedMember(email, password) {
    const data = unwrapApiResponse(await api.post('/auth/restore', { email, password }))
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

    const restoringToken = accessToken.value
    isRestoring.value = true
    restorePromise = api
      .get('/auth/me', { skipAuthRedirect: true })
      .then((response) => {
        const data = unwrapApiResponse(response)
        if (accessToken.value === restoringToken) {
          user.value = data
        }
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

  async function refreshProfile() {
    const data = await fetchMyProfile()
    user.value = data
    return data
  }

  async function updateProfile(payload) {
    const data = await updateMyProfile(payload)
    user.value = data
    return data
  }

  async function withdraw(password) {
    await withdrawMe(password)
    clearAuth()
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    isRestoring,
    login,
    signup,
    restoreDeletedMember,
    exchangeOAuthCode,
    restoreUser,
    refreshProfile,
    updateProfile,
    withdraw,
    logout,
    setAuth,
    clearAuth,
  }
})
