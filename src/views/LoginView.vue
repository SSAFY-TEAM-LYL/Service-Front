<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 모두 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '로그인에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <h1 class="auth-title">로그인</h1>
        <p class="auth-subtitle">LYL에 오신 것을 환영합니다</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="input-group">
          <label for="login-email">이메일</label>
          <input
            type="email"
            id="login-email"
            v-model="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="input-group">
          <label for="login-password">비밀번호</label>
          <input
            type="password"
            id="login-password"
            v-model="password"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-text" style="margin-bottom: var(--space-4);">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <div class="auth-divider"><span>또는</span></div>

      <div class="social-buttons">
        <button class="btn btn-outline btn-block social-btn">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google로 계속하기
        </button>
        <button class="btn btn-block social-btn kakao-btn">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#000" d="M12 3C6.48 3 2 6.36 2 10.5c0 2.63 1.74 4.95 4.38 6.3l-1.12 4.1c-.1.36.31.65.62.44l4.83-3.2c.42.04.85.06 1.29.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/></svg>
          Kakao로 계속하기
        </button>
      </div>

      <p class="auth-footer">
        아직 계정이 없으신가요?
        <RouterLink to="/signup" class="auth-link">회원가입</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px - 64px);
  padding: var(--space-8) var(--space-4);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-10);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.auth-title {
  font-size: var(--font-2xl);
  font-weight: 800;
  margin-bottom: var(--space-2);
}

.auth-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.auth-form {
  margin-bottom: var(--space-4);
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--font-xs);
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-border-light);
}

.auth-divider span {
  padding: 0 var(--space-3);
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.social-btn {
  font-weight: 500;
  gap: var(--space-3);
}

.kakao-btn {
  background-color: var(--color-kakao);
  color: #1a1a1a;
  border: 1px solid var(--color-kakao);
}

.kakao-btn:hover {
  background-color: #f5da00;
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.auth-link {
  color: var(--color-primary);
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
