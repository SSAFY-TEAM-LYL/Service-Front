<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref(String(route.query.email || ''))
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const handleRestore = async () => {
  errorMsg.value = ''
  if (!email.value.trim() || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 모두 입력해주세요.'
    return
  }

  loading.value = true
  try {
    await auth.restoreDeletedMember(email.value.trim(), password.value)
    router.push('/mypage')
  } catch (error) {
    errorMsg.value = error.response?.data?.message || '계정 복구에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const startOAuthRestore = (provider) => {
  errorMsg.value = ''
  sessionStorage.setItem('oauthRedirectAfterLogin', '/mypage')
  window.location.href = `${apiBaseUrl}/oauth2/authorization/${provider}?mode=restore`
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <h1 class="auth-title">계정 복구</h1>
        <p class="auth-subtitle">탈퇴한 계정의 이메일과 비밀번호를 확인합니다</p>
      </div>

      <form class="auth-form" @submit.prevent="handleRestore">
        <div class="input-group">
          <label for="restore-email">이메일</label>
          <input
            id="restore-email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <div class="input-group">
          <label for="restore-password">비밀번호</label>
          <input
            id="restore-password"
            v-model="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
          />
        </div>

        <p v-if="errorMsg" class="error-text form-error">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '복구 중...' : '계정 복구' }}
        </button>
      </form>

      <div class="auth-divider"><span>또는</span></div>

      <div class="social-buttons">
        <button type="button" class="btn btn-outline btn-block social-btn" @click="startOAuthRestore('google')">
          Google 계정으로 복구
        </button>
        <button type="button" class="btn btn-block social-btn kakao-btn" @click="startOAuthRestore('kakao')">
          Kakao 계정으로 복구
        </button>
      </div>

      <p class="auth-footer">
        복구가 필요 없으신가요?
        <RouterLink to="/login" class="auth-link">로그인</RouterLink>
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
}

.kakao-btn {
  background-color: var(--color-kakao);
  color: #1a1a1a;
  border: 1px solid var(--color-kakao);
}

.kakao-btn:hover {
  background-color: #f5da00;
}

.form-error {
  margin-bottom: var(--space-4);
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
