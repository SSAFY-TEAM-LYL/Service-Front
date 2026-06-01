import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
    },
    {
      path: '/board/write',
      name: 'board-write',
      component: () => import('@/views/BoardWriteView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/board/:id',
      name: 'board-detail',
      component: () => import('@/views/BoardDetailView.vue'),
      props: true,
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const auth = useAuthStore()
  if (auth.isLoggedIn && !auth.user) {
    try {
      await auth.restoreUser()
    } catch {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  if (!auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
