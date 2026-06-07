import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const unwrapApiResponse = (response) => {
  const body = response.data
  if (body && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data
  }
  return body
}

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        localStorage.removeItem('accessToken')
        const isAuthRequest = error.config?.url?.startsWith('/auth/')
        const shouldRedirect = !error.config?.skipAuthRedirect && !isAuthRequest

        if (shouldRedirect && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
