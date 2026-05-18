<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <RouterLink to="/" class="logo">
        <span class="logo-icon">⟨/⟩</span>
        <span class="logo-text">LYL</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/board" class="nav-link">커뮤니티</RouterLink>

        <template v-if="auth.isLoggedIn">
          <span class="nav-user">{{ auth.user?.nickname || '사용자' }}</span>
          <button class="btn btn-ghost" @click="handleLogout">로그아웃</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link">로그인</RouterLink>
          <RouterLink to="/signup" class="btn btn-primary btn-sm">회원가입</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <main class="main">
    <RouterView />
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <span class="footer-logo">⟨/⟩ LYL</span>
      <span class="footer-copy">&copy; 2026 LYL — 코딩테스트 스터디 플랫폼</span>
    </div>
  </footer>
</template>

<style scoped>
/* ===== Header ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-light);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  font-size: var(--font-lg);
  font-weight: 800;
  color: var(--color-primary);
}

.logo-text {
  font-size: var(--font-xl);
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.nav-link {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-1);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: all var(--transition-fast);
  transform: translateX(-50%);
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link:hover::after {
  width: 100%;
}

.nav-user {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-text);
}

/* ===== Main ===== */
.main {
  min-height: calc(100vh - 60px - 64px);
}

/* ===== Footer ===== */
.footer {
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-5) 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-logo {
  font-weight: 700;
  color: var(--color-primary);
  font-size: var(--font-sm);
}

.footer-copy {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}
</style>
