<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const navImageFailed = ref(false)

watch(
  () => auth.user?.profileImageUrl,
  () => {
    navImageFailed.value = false
  },
)

const showNavProfileImage = computed(() => auth.user?.profileImageUrl && !navImageFailed.value)

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
          <RouterLink to="/mypage" class="nav-profile" aria-label="마이페이지로 이동">
            <img
              v-if="showNavProfileImage"
              :src="auth.user.profileImageUrl"
              :alt="`${auth.user?.nickname || '사용자'} 프로필`"
              class="nav-avatar"
              @error="navImageFailed = true"
            />
            <span v-else class="nav-avatar nav-avatar-fallback">
              {{ (auth.user?.nickname || 'U').slice(0, 1).toUpperCase() }}
            </span>
            <span class="nav-user">{{ auth.user?.nickname || '사용자' }}</span>
          </RouterLink>
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

.nav-profile {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: 4px var(--space-2) 4px 4px;
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.nav-profile:hover {
  background-color: var(--color-primary-light);
}

.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.nav-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
  font-size: var(--font-sm);
  font-weight: 800;
}

.nav-user {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
