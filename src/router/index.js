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
      path: '/account/restore',
      name: 'account-restore',
      component: () => import('@/views/AccountRestoreView.vue'),
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('@/views/OAuthCallbackView.vue'),
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: () => import('@/views/MyPageView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('@/views/ProblemListView.vue'),
    },
    {
      path: '/problems/:problemId',
      name: 'problem-detail',
      component: () => import('@/views/ProblemDetailView.vue'),
      props: true,
    },
    {
      path: '/admin/problem-publications',
      name: 'admin-problem-publications',
      component: () => import('@/views/AdminProblemPublicationsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
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
  if (!to.meta.requiresAuth && !to.meta.requiresAdmin) return true

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

  if (to.meta.requiresAdmin && auth.user?.role !== 'ADMIN') {
    return { name: 'main' }
  }

  return true
})

export default router
