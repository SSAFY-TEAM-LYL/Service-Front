<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  nickname: '',
  email: '',
  password: '',
  passwordConfirm: '',
})
const errors = ref({})
const loading = ref(false)

const validate = () => {
  const e = {}
  if (!form.value.nickname.trim()) e.nickname = '닉네임을 입력해주세요.'
  if (!form.value.email.trim()) e.email = '이메일을 입력해주세요.'
  if (!form.value.password) e.password = '비밀번호를 입력해주세요.'
  else if (form.value.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  if (form.value.password !== form.value.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  errors.value = e
  return Object.keys(e).length === 0
}

const handleSignup = async () => {
  if (!validate()) return
  loading.value = true
  try {
    await auth.signup({
      nickname: form.value.nickname,
      email: form.value.email,
      password: form.value.password,
    })
    router.push('/')
  } catch (e) {
    errors.value.general = e.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <h1 class="auth-title">회원가입</h1>
        <p class="auth-subtitle">LYL과 함께 코딩테스트를 준비하세요</p>
      </div>

      <form @submit.prevent="handleSignup" class="auth-form">
        <div class="input-group">
          <label for="signup-nickname">닉네임</label>
          <input
            type="text"
            id="signup-nickname"
            v-model="form.nickname"
            placeholder="닉네임을 입력하세요"
            :class="{ 'input-error': errors.nickname }"
          />
          <p v-if="errors.nickname" class="error-text">{{ errors.nickname }}</p>
        </div>

        <div class="input-group">
          <label for="signup-email">이메일</label>
          <input
            type="email"
            id="signup-email"
            v-model="form.email"
            placeholder="you@example.com"
            autocomplete="email"
            :class="{ 'input-error': errors.email }"
          />
          <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
        </div>

        <div class="input-group">
          <label for="signup-password">비밀번호</label>
          <input
            type="password"
            id="signup-password"
            v-model="form.password"
            placeholder="8자 이상 입력하세요"
            autocomplete="new-password"
            :class="{ 'input-error': errors.password }"
          />
          <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
        </div>

        <div class="input-group">
          <label for="signup-password-confirm">비밀번호 확인</label>
          <input
            type="password"
            id="signup-password-confirm"
            v-model="form.passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            autocomplete="new-password"
            :class="{ 'input-error': errors.passwordConfirm }"
          />
          <p v-if="errors.passwordConfirm" class="error-text">{{ errors.passwordConfirm }}</p>
        </div>

        <p v-if="errors.general" class="error-text" style="margin-bottom: var(--space-4); text-align: center;">{{ errors.general }}</p>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="auth-footer">
        이미 계정이 있으신가요?
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
