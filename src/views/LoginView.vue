<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AqLogo from '@/components/AqLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage, getOAuthErrorMessage } from '@/utils/authErrors'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const canRestoreDeletedMember = ref(false)
const loading = ref(false)
const rememberMe = ref(true)
const showPassword = ref(false)

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const leftStats = [
  { label: 'OPEN PROBLEMS', value: 12, tone: 'green' },
  { label: 'CODE RUNNERS', value: 3, tone: 'purple' },
  { label: 'BOARD THREADS', value: 28, tone: 'gold' },
]
const displayedStats = ref(leftStats.map(() => 0))

let statDelayTimer = 0
const statTimers = []

const clearStatTimers = () => {
  if (statDelayTimer) {
    window.clearTimeout(statDelayTimer)
    statDelayTimer = 0
  }
  while (statTimers.length > 0) {
    window.clearInterval(statTimers.pop())
  }
}

const startStatCounter = () => {
  clearStatTimers()
  displayedStats.value = leftStats.map(() => 0)

  leftStats.forEach((stat, index) => {
    const stepMs = Math.max(48, Math.round(1500 / stat.value))
    const timer = window.setTimeout(() => {
      let nextValue = 0
      const interval = window.setInterval(() => {
        nextValue += 1
        displayedStats.value = displayedStats.value.map((value, valueIndex) =>
          valueIndex === index ? Math.min(nextValue, stat.value) : value,
        )
        if (nextValue >= stat.value) {
          window.clearInterval(interval)
        }
      }, stepMs)
      statTimers.push(interval)
    }, 180 * index)
    statTimers.push(timer)
  })
}

watch(
  () => route.query.error,
  (error) => {
    if (!error) return
    errorMsg.value = getOAuthErrorMessage(error)
    canRestoreDeletedMember.value = String(error).toUpperCase() === 'DELETED_MEMBER'
  },
  { immediate: true },
)

const handleLogin = async () => {
  errorMsg.value = ''
  canRestoreDeletedMember.value = false
  if (!email.value || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 모두 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (e) {
    canRestoreDeletedMember.value = e.response?.data?.code === 'DELETED_MEMBER'
    errorMsg.value = getApiErrorMessage(e, '로그인에 실패했습니다. 다시 시도해주세요.')
  } finally {
    loading.value = false
  }
}

const startOAuth = (provider) => {
  errorMsg.value = ''
  canRestoreDeletedMember.value = false
  sessionStorage.setItem('oauthRedirectAfterLogin', route.query.redirect || '/')
  window.location.href = `${apiBaseUrl}/oauth2/authorization/${provider}`
}

const restoreRoute = () => ({
  name: 'account-restore',
  query: email.value.trim() ? { email: email.value.trim() } : {},
})

onMounted(() => {
  statDelayTimer = window.setTimeout(startStatCounter, 280)
})

onBeforeUnmount(() => {
  clearStatTimers()
})
</script>

<template>
  <main class="login-screen">
    <section class="login-side" aria-label="알고퀘스트 소개">
      <RouterLink to="/" class="login-brand" aria-label="알고퀘스트 홈">
        <span class="login-brand-mark" aria-hidden="true">
          <AqLogo class="login-brand-emblem" />
        </span>
        <span class="login-brand-text">
          알고퀘스트
          <small>▶ ALGO QUEST</small>
        </span>
      </RouterLink>

      <div class="login-status">
        <span class="status-dot" aria-hidden="true" />
        <strong>SERVICE FRONT ONLINE</strong>
      </div>

      <div class="login-copy">
        <p>WELCOME</p>
        <h1>BACK, HERO</h1>
        <span>문제 풀이, 코드 제출, 게시판까지 실제 서비스 기능으로 퀘스트를 이어가세요.</span>
      </div>

      <dl class="login-stats" aria-label="서비스 요약">
        <div v-for="(stat, index) in leftStats" :key="stat.label">
          <dt>{{ stat.label }}</dt>
          <dd class="login-stat-value" :class="`tone-${stat.tone}`">
            {{ displayedStats[index] }}
          </dd>
        </div>
      </dl>

      <blockquote class="login-quote">
        <p>"하루 한 문제씩 꾸준히 푸는 것이 알고리즘 실력 향상의 가장 빠른 길입니다."</p>
        <footer>- 알고퀘스트 학습 가이드</footer>
      </blockquote>
    </section>

    <section class="login-stage" aria-label="로그인">
      <div class="login-window">
        <div class="login-window-title">■ PLAYER LOGIN</div>

        <div class="login-window-body">
          <div class="login-socials">
            <button type="button" class="social-login" @click="startOAuth('google')">
              <span class="google-mark">G</span>
              <strong>Google로 로그인</strong>
            </button>
            <button type="button" class="social-login kakao-social" @click="startOAuth('kakao')">
              <span class="social-icon">K</span>
              <strong>Kakao로 로그인</strong>
            </button>
          </div>

          <div class="login-divider"><span>OR</span></div>

          <form class="login-form" @submit.prevent="handleLogin">
            <label class="login-field" for="login-email">
              <span>▶ EMAIL</span>
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="hero@quest.com"
                required
              />
            </label>

            <label class="login-field" for="login-password">
              <span>▶ PASSWORD</span>
              <div class="password-box">
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  required
                />
                <button type="button" aria-label="비밀번호 보기 전환" @click="showPassword = !showPassword">
                  {{ showPassword ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
            </label>

            <label class="remember-row">
              <input v-model="rememberMe" type="checkbox" />
              <span>로그인 상태 유지</span>
            </label>

            <div v-if="errorMsg" class="message error login-error">
              <p>{{ errorMsg }}</p>
              <RouterLink v-if="canRestoreDeletedMember" :to="restoreRoute()" class="btn btn-outline btn-block">
                계정 복구하기
              </RouterLink>
            </div>

            <button type="submit" class="enter-quest-btn" :disabled="loading">
              <span>{{ loading ? 'ENTERING...' : 'ENTER QUEST' }}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p class="login-bottom-link">
            계정이 없으신가요?
            <RouterLink to="/signup">회원가입</RouterLink>
            <span aria-hidden="true"> · </span>
            <RouterLink to="/account/restore">계정 복구</RouterLink>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-screen {
  display: grid;
  grid-template-columns: minmax(360px, 40vw) minmax(0, 1fr);
  min-height: 100dvh;
  background:
    linear-gradient(90deg, var(--ink) 0 40%, transparent 40%),
    radial-gradient(circle at 1px 1px, rgba(124, 58, 237, 0.18) 1.5px, transparent 1.5px) 0 0 / 38px 38px,
    #f4f0ea;
  color: var(--ink);
}

.login-side {
  display: grid;
  align-content: space-between;
  gap: clamp(18px, 2vw, 34px);
  min-height: 100dvh;
  background: var(--ink);
  color: #f7f3ff;
  padding: clamp(24px, 3vw, 52px);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  width: max-content;
}

.login-brand-mark {
  display: grid;
  place-items: center;
  width: clamp(58px, 4.9vw, 74px);
  height: clamp(58px, 4.9vw, 74px);
}

.login-brand-emblem {
  width: 100%;
  height: 100%;
  filter: drop-shadow(5px 5px 0 #12092f);
}

.login-brand-text {
  color: #c4b5fd;
  font-family: var(--font-mono);
  font-size: clamp(1.05rem, 1.4vw, 1.45rem);
  font-weight: 950;
  text-shadow: 4px 4px 0 var(--primary-shadow);
}

.login-brand small {
  display: block;
  margin-top: 7px;
  color: var(--green);
  font-size: 0.76rem;
  letter-spacing: 0.18em;
  text-shadow: none;
}

.login-status {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  border: 3px solid var(--primary);
  background: rgba(124, 58, 237, 0.12);
  box-shadow: 5px 5px 0 var(--primary-shadow);
  color: var(--green);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  padding: 13px 18px;
}

.status-dot {
  width: 12px;
  height: 12px;
  background: var(--cyan);
}

.login-copy {
  display: grid;
  gap: 10px;
  max-width: 560px;
}

.login-copy p,
.login-copy h1 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: clamp(2.2rem, 3.8vw, 4.1rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.login-copy p {
  color: #fff;
}

.login-copy h1 {
  color: #7dd3fc;
}

.login-copy span {
  max-width: 430px;
  color: #c4b5fd;
  font-size: clamp(0.95rem, 1.05vw, 1.12rem);
  font-weight: 750;
  line-height: 1.75;
  margin-top: clamp(8px, 1.2vw, 18px);
}

.login-stats {
  display: grid;
  gap: 12px;
  margin: 0;
}

.login-stats div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 62px;
  border: 3px solid var(--primary-shadow);
  background: #130b36;
  box-shadow: 5px 5px 0 var(--primary-shadow);
  padding: 14px 20px;
}

.login-stats dt,
.login-stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-weight: 950;
}

.login-stats dt {
  color: #c4b5fd;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.login-stats dd {
  color: white;
  font-size: 1.25rem;
}

.login-stat-value {
  display: inline-block;
  min-width: 3ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  animation: login-stat-arrive 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes login-stat-arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tone-green {
  color: var(--green) !important;
}

.tone-purple {
  color: #c4b5fd !important;
}

.tone-gold {
  color: var(--gold) !important;
}

.login-quote {
  border: 3px solid var(--primary-shadow);
  background: #130b36;
  box-shadow: 5px 5px 0 var(--primary-shadow);
  margin: 0;
  padding: 20px;
}

.login-quote p {
  color: #fff;
  font-weight: 850;
  line-height: 1.7;
  margin: 0 0 12px;
}

.login-quote footer {
  color: #c4b5fd;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 850;
}

.login-stage {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  width: 100%;
  padding: clamp(24px, 5vw, 88px);
}

.login-window {
  width: min(720px, 100%);
  border: 4px solid var(--ink);
  background: var(--surface-plain);
  box-shadow: 8px 8px 0 var(--ink);
}

.login-window-title {
  border-bottom: 4px solid var(--ink);
  background: var(--ink);
  color: #c4b5fd;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 950;
  letter-spacing: 0.14em;
  padding: 16px 24px;
}

.login-window-body {
  display: grid;
  gap: clamp(14px, 1.6vw, 20px);
  padding: clamp(20px, 2.7vw, 36px);
}

.login-socials,
.login-form {
  display: grid;
  gap: 12px;
}

.social-login,
.enter-quest-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 56px;
  border: 4px solid var(--primary-line);
  background: white;
  box-shadow: 5px 5px 0 var(--line-soft);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: clamp(0.92rem, 1vw, 1.08rem);
  font-weight: 950;
  transition:
    box-shadow 120ms ease,
    transform 120ms ease,
    border-color 120ms ease;
}

.social-login:hover,
.enter-quest-btn:hover:not(:disabled) {
  border-color: var(--primary);
  box-shadow: 5px 5px 0 var(--primary-shadow);
  transform: translate(-2px, -2px);
}

.kakao-social {
  border-color: #facc15;
  background: #fef08a;
  box-shadow: 5px 5px 0 #ca8a04;
}

.social-icon,
.google-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.45);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 950;
}

.google-mark {
  background: #eff6ff;
  color: #2563eb;
}

.login-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-weight: 950;
}

.login-divider::before,
.login-divider::after {
  display: block;
  height: 4px;
  background: var(--ink);
  content: "";
}

.login-field {
  display: grid;
  gap: 9px;
}

.login-field > span {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.06em;
}

.login-field input,
.password-box {
  width: 100%;
  min-height: 56px;
  border: 4px solid var(--primary-line);
  background: var(--surface-panel);
}

.login-field input {
  color: var(--ink);
  font-family: var(--font-mono);
  font-weight: 850;
  outline: none;
  padding: 0 18px;
}

.login-field input::placeholder {
  color: var(--muted);
}

.login-field input:focus,
.password-box:focus-within {
  border-color: var(--primary);
  box-shadow: 4px 4px 0 var(--line-soft);
}

.password-box {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.password-box input {
  min-height: 48px;
  border: 0;
  background: transparent;
}

.password-box button {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 950;
  padding: 0 16px;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  color: var(--muted);
  font-weight: 800;
}

.remember-row input {
  width: 22px;
  height: 22px;
  margin: 0;
  accent-color: var(--primary);
}

.message.error {
  display: grid;
  gap: 10px;
  border: 3px solid var(--red);
  background: #fff1f2;
  color: var(--red-dark);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 850;
  padding: 12px;
}

.enter-quest-btn {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: 6px 6px 0 var(--primary-shadow);
  color: white;
}

.login-bottom-link {
  color: var(--muted);
  font-weight: 800;
  margin: 0;
  text-align: center;
}

.login-bottom-link a {
  color: var(--primary);
  font-weight: 950;
}

@media (max-width: 1020px) {
  .login-screen {
    grid-template-columns: 1fr;
    background: var(--background);
  }

  .login-side {
    order: 2;
    min-height: auto;
  }

  .login-stage {
    min-height: auto;
  }
}

@media (max-width: 620px) {
  .login-side,
  .login-stage {
    padding: 18px 12px;
  }

  .login-window-body {
    padding: 18px;
  }
}

@media (max-height: 760px) and (min-width: 1021px) {
  .login-quote {
    display: none;
  }

  .login-side {
    padding-block: 24px;
  }

  .login-window-body {
    gap: 12px;
    padding-block: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-stat-value {
    animation: none;
  }
}
</style>
