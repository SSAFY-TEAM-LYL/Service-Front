<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code
  const error = route.query.error
  const redirect = sessionStorage.getItem('oauthRedirectAfterLogin') || '/'
  sessionStorage.removeItem('oauthRedirectAfterLogin')

  if (error) {
    errorMsg.value = '소셜 로그인에 실패했습니다. 다시 시도해주세요.'
    return
  }

  if (!code) {
    errorMsg.value = 'OAuth 로그인 코드가 없습니다.'
    return
  }

  try {
    await auth.exchangeOAuthCode(code)
    router.replace(redirect)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '소셜 로그인 처리에 실패했습니다.'
  }
})

const goLogin = () => {
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="callback-page">
    <div class="callback-panel fade-in">
      <h1>로그인 처리 중</h1>
      <p v-if="!errorMsg">잠시만 기다려주세요.</p>
      <template v-else>
        <p class="error-text">{{ errorMsg }}</p>
        <button type="button" class="btn btn-primary" @click="goLogin">로그인으로 돌아가기</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  display: flex;
  min-height: calc(100vh - 60px - 64px);
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.callback-panel {
  width: 100%;
  max-width: 360px;
  text-align: center;
}

.callback-panel h1 {
  margin-bottom: var(--space-3);
  font-size: var(--font-xl);
  font-weight: 800;
}

.callback-panel p {
  margin-bottom: var(--space-5);
  color: var(--color-text-muted);
}
</style>
