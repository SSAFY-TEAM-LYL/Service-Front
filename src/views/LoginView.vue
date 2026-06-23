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
  { label: 'AI PROBLEMS READY', value: 12, tone: 'green' },
  { label: 'CODE RUNS TODAY', value: 3, tone: 'purple' },
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
    <section class="login-side" aria-label="알트 소개">
      <RouterLink to="/" class="login-brand" aria-label="알트 홈">
        <span class="login-brand-mark" aria-hidden="true">
          <AqLogo class="login-brand-emblem" />
        </span>
        <span class="login-brand-text">
          알트
          <small>▶ ALTERNATIVE LEARNING TRACK</small>
        </span>
      </RouterLink>

      <div class="login-status">
        <span class="status-dot" aria-hidden="true" />
        <strong>AI ENGINE ONLINE</strong>
      </div>

      <div class="login-copy">
        <p><span class="acronym-key">A</span>lternative <span class="acronym-key">L</span>earning <span class="acronym-key">T</span>rack</p>
        <h1><span class="acronym-key acronym-key-wide">Al</span>gorithm <span class="acronym-key">T</span>raining</h1>
        <span>
          AI 생성 문제로 알고리즘 공부를 더 알차게,<br />
          풀이, 코드 제출, 게시판까지 한 흐름으로 이어가세요.
        </span>
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
        <p>"오늘의 AI 문제가 내일의 풀이 감각을 더 선명하게 만듭니다."</p>
        <footer>- Alt Algorithm Training</footer>
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
              <span>{{ loading ? 'STARTING...' : 'START TRAINING' }}</span>
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
  --login-accent: var(--theme-login-accent, #15803d);
  --login-left-bg: var(--theme-login-left-bg, var(--panel-deep));
  --login-stage-bg: var(--theme-login-stage-bg, #fbfbfd);
  --login-grid-dot: var(--theme-login-grid-dot, rgba(76, 29, 149, 0.07));
  --login-frame: var(--theme-login-frame, var(--ink));
  --login-window-bg: var(--theme-login-window-bg, var(--surface-plain));
  --login-window-title-bg: var(--theme-login-window-title-bg, var(--login-frame));
  --login-window-title-text: var(--theme-login-window-title-text, var(--primary-line));
  --login-control-bg: var(--theme-login-control-bg, #fff);
  --login-control-text: var(--theme-login-control-text, var(--ink));
  --login-divider-line: var(--theme-login-divider-line, var(--ink));
  --login-field-label: var(--theme-login-field-label, var(--ink));
  --login-input-bg: var(--theme-login-input-bg, var(--surface-panel));
  --login-error-bg: var(--theme-login-error-bg, #fff1f2);
  --login-support-text: var(--theme-login-support-text, var(--primary-line));
  --login-side-card-bg: var(--theme-login-side-card-bg, var(--panel-dark));
  --login-side-card-border: var(--theme-login-side-card-border, var(--primary-shadow));
  --login-side-card-shadow: var(--theme-login-side-card-shadow, var(--primary-shadow));
  --login-hero-accent: var(--theme-login-hero-accent, var(--cyan));
  --login-stat-positive: var(--theme-login-stat-positive, var(--green));
  --login-stat-secondary: var(--theme-login-stat-secondary, var(--login-support-text));
  --login-stat-warm: var(--theme-login-stat-warm, var(--gold));

  display: grid;
  grid-template-columns: minmax(360px, 40vw) minmax(0, 1fr);
  min-height: 100dvh;
  background:
    linear-gradient(90deg, var(--login-left-bg) 0 40%, transparent 40%),
    radial-gradient(circle at 1px 1px, var(--login-grid-dot) 1.5px, transparent 1.5px) 0 0 / 38px 38px,
    var(--login-stage-bg);
  color: var(--login-control-text);
}

.login-side {
  display: grid;
  align-content: space-between;
  gap: clamp(18px, 2vw, 34px);
  min-height: 100dvh;
  background: var(--login-left-bg);
  color: #f7f3ff;
  padding: clamp(24px, 3vw, 52px);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
}

.login-brand-mark {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
}

.login-brand-emblem {
  width: 100%;
  height: 100%;
  filter: none;
}

.login-brand-text {
  color: var(--login-brand-text, var(--primary-line));
  font-family: var(--font-mono);
  font-size: clamp(1.05rem, 1.4vw, 1.45rem);
  font-weight: 950;
  text-shadow: var(--login-brand-text-shadow, 4px 4px 0 var(--primary-shadow));
}

.login-brand small {
  display: block;
  margin-top: 2px;
  color: var(--login-brand-kicker, var(--login-accent));
  font-size: 0.78rem;
  letter-spacing: 0;
  text-shadow: none;
  white-space: nowrap;
}

.login-status {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  border: 3px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  box-shadow: 5px 5px 0 var(--primary-shadow);
  color: var(--login-accent);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  padding: 13px 18px;
}

.status-dot {
  width: 12px;
  height: 12px;
  background: var(--login-accent);
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
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
  white-space: nowrap;
}

.login-copy p {
  color: #fff;
  font-size: 1.3rem;
}

.login-copy h1 {
  color: var(--login-hero-accent);
  font-size: 2.7rem;
}

.acronym-key {
  color: color-mix(in srgb, var(--primary-line) 78%, white);
  line-height: 1;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--primary-line) 72%, transparent);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.13em;
}

.acronym-key-wide {
  letter-spacing: 0.01em;
}

.login-copy h1 .acronym-key {
  display: inline-grid;
  place-items: center;
  min-width: 1.12em;
  height: 1.12em;
  margin-right: 0.03em;
  border: 2px solid color-mix(in srgb, var(--primary-line) 78%, white);
  background: color-mix(in srgb, var(--primary-line) 24%, var(--panel-dark));
  box-shadow: 3px 3px 0 var(--primary-shadow);
  color: #fff;
  text-decoration: none;
  transform: translateY(-0.04em);
}

.login-copy h1 .acronym-key-wide {
  min-width: 1.56em;
}

.login-copy > span {
  max-width: 430px;
  color: var(--login-support-text);
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
  border: 3px solid var(--login-side-card-border);
  background: var(--login-side-card-bg);
  box-shadow: 5px 5px 0 var(--login-side-card-shadow);
  padding: 14px 20px;
}

.login-stats dt,
.login-stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-weight: 950;
}

.login-stats dt {
  color: var(--login-support-text);
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
  color: var(--login-stat-positive) !important;
}

.tone-purple {
  color: var(--login-stat-secondary) !important;
}

.tone-gold {
  color: var(--login-stat-warm) !important;
}

.login-quote {
  border: 3px solid var(--login-side-card-border);
  background: var(--login-side-card-bg);
  box-shadow: 5px 5px 0 var(--login-side-card-shadow);
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
  color: var(--login-support-text);
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
  border: 4px solid var(--login-frame);
  background: var(--login-window-bg);
  box-shadow: 8px 8px 0 var(--login-frame);
}

.login-window-title {
  border-bottom: 4px solid var(--login-frame);
  background: var(--login-window-title-bg);
  color: var(--login-window-title-text);
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
  background: var(--login-control-bg);
  box-shadow: 5px 5px 0 var(--line-soft);
  color: var(--login-control-text);
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
  color: #1f2937;
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
  background: var(--login-divider-line);
  content: "";
}

.login-field {
  display: grid;
  gap: 9px;
}

.login-field > span {
  color: var(--login-field-label);
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
  background: var(--login-input-bg);
}

.login-field input {
  color: var(--login-control-text);
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
  background: var(--login-error-bg);
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

@media (max-width: 1220px) and (min-width: 1021px) {
  .login-copy p {
    font-size: 0.95rem;
  }

  .login-copy h1 {
    font-size: 2.05rem;
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

  .login-brand small {
    font-size: 0.66rem;
  }

  .login-copy p {
    font-size: 0.78rem;
  }

  .login-copy h1 {
    font-size: 1.55rem;
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
