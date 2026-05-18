import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('accessToken') || null)

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

  function logout() {
    clearAuth()
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    login,
    signup,
    logout,
    setAuth,
    clearAuth,
  }
})
