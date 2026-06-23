<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMyStreak } from '@/api/streaks'
import DailyStreakGrass from '@/components/DailyStreakGrass.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const XP_PER_LEVEL = 50

const heroName = computed(() => auth.user?.nickname || 'Alt Learner')
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const streak = ref(null)
const isLoadingStreak = ref(false)
const streakError = ref('')

const currentXp = computed(() => Number(auth.user?.xp) || 0)
const currentLevel = computed(() => Number(auth.user?.level) || Math.floor(currentXp.value / XP_PER_LEVEL) + 1)
const currentLevelXp = computed(() => currentXp.value % XP_PER_LEVEL)
const nextLevelXp = computed(() => XP_PER_LEVEL - currentLevelXp.value)
const xpProgressPercent = computed(() => Math.min(100, Math.max(0, (currentLevelXp.value / XP_PER_LEVEL) * 100)))
const xpProgressText = computed(() => `${currentLevelXp.value} / ${XP_PER_LEVEL} XP`)
const xpStatusMessage = computed(() => {
  return `현재 경험치 : ${currentXp.value} XP, Lv. ${currentLevel.value + 1}까지 ${nextLevelXp.value} XP 남았습니다! 화이팅!`
})

const overviewCards = computed(() => {
  const cards = [
    {
      label: 'PROBLEMS',
      value: '문제풀기',
      note: '공개 문제 목록',
      tone: 'green',
      to: '/problems',
      icon: '◎',
    },
    {
      label: 'CODE RUN',
      value: '제출/채점',
      note: '문제 상세에서 실행',
      tone: 'blue',
      to: '/problems',
      icon: '</>',
    },
    {
      label: 'BOARD',
      value: '게시판',
      note: '공지·질문·자유글',
      tone: 'purple',
      to: '/board',
      icon: '□',
    },
    {
      label: 'PROFILE',
      value: auth.isLoggedIn ? '내 정보' : '로그인',
      note: auth.isLoggedIn ? '회원정보 관리' : '제출 기능 활성화',
      tone: 'gold',
      to: auth.isLoggedIn ? '/mypage' : '/login',
      icon: '◆',
    },
  ]

  if (isAdmin.value) {
    return [
      ...cards,
      {
        label: 'ADMIN',
        value: '문제 공개',
        note: '관리자 도구',
        tone: 'red',
        to: '/admin/problem-publications',
        icon: '▣',
      },
    ]
  }

  return cards
})

const loadStreak = async () => {
  if (!auth.isLoggedIn) {
    streak.value = null
    return
  }

  isLoadingStreak.value = true
  streakError.value = ''
  try {
    streak.value = await fetchMyStreak()
  } catch (error) {
    streakError.value = error.response?.data?.message || '스트릭을 불러오지 못했습니다.'
  } finally {
    isLoadingStreak.value = false
  }
}

watch(
  () => auth.isLoggedIn,
  () => {
    loadStreak()
  },
)

onMounted(loadStreak)
</script>

<template>
  <div class="dashboard-page fade-in">
    <section class="dashboard-panel player-status-panel">
      <div class="panel-titlebar">
        <strong>★ ALT STATUS</strong>
        <span>2026.06 SERVICE</span>
      </div>

      <div class="player-summary">
        <div class="level-box">
          <span>LV</span>
          <strong>{{ currentLevel }}</strong>
        </div>

        <div class="player-copy">
          <p class="eyebrow">WELCOME BACK</p>
          <h1>{{ heroName }}</h1>
          <p>{{ xpStatusMessage }}</p>
          <div class="xp-meta" aria-hidden="true">
            <span>Lv. {{ currentLevel }}</span>
            <strong>{{ xpProgressText }}</strong>
            <span>Lv. {{ currentLevel + 1 }}</span>
          </div>
          <div
            class="xp-bar"
            :aria-label="`레벨 ${currentLevel} 경험치 진행도 ${xpProgressText}`"
          >
            <span :style="{ width: `${xpProgressPercent}%` }" />
          </div>
        </div>
      </div>

      <div v-if="auth.isLoggedIn" class="dashboard-streak">
        <DailyStreakGrass :streak="streak" :loading="isLoadingStreak" :error="streakError" compact />
      </div>
    </section>

    <section class="section-heading">
      <strong>OVERVIEW</strong>
      <span />
    </section>

    <section class="overview-grid" aria-label="서비스 기능">
      <RouterLink
        v-for="card in overviewCards"
        :key="card.label"
        :to="card.to"
        class="overview-card"
        :class="`tone-${card.tone}`"
      >
        <span>{{ card.label }}</span>
        <i>{{ card.icon }}</i>
        <strong>{{ card.value }}</strong>
        <small>{{ card.note }}</small>
      </RouterLink>
    </section>

    <section class="dashboard-columns">
      <article class="dashboard-card">
        <header>▸ 문제 풀이 플로우</header>
        <ol>
          <li>문제 목록에서 공개 문제를 선택합니다.</li>
          <li>문제 상세에서 언어와 템플릿 코드를 선택합니다.</li>
          <li>제출 후 채점 결과와 최근 제출을 확인합니다.</li>
        </ol>
      </article>

      <article class="dashboard-card">
        <header>▸ 커뮤니티 플로우</header>
        <ol>
          <li>공지, 자유, 질문 카테고리를 탐색합니다.</li>
          <li>로그인 후 게시글을 작성하고 수정할 수 있습니다.</li>
          <li>게시글 상세에서 내용을 확인합니다.</li>
        </ol>
      </article>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 22px;
}

.dashboard-panel,
.dashboard-card,
.overview-card {
  border: 3px solid var(--primary-line);
  background: var(--surface-plain);
  box-shadow: var(--pixel-shadow-muted);
}

.panel-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 46px;
  padding: 12px 18px;
  background: var(--dashboard-titlebar-bg, var(--primary));
  color: var(--dashboard-titlebar-text, #fff);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.1em;
}

.panel-titlebar strong {
  color: var(--dashboard-title-highlight, var(--gold));
}

.panel-titlebar span {
  color: var(--dashboard-title-meta, #ddd6fe);
}

.player-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: clamp(22px, 3vw, 38px);
  background: var(--dashboard-hero-bg, transparent);
}

.level-box {
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border: 4px solid var(--dashboard-level-border, var(--primary-line));
  background: var(--dashboard-level-bg, var(--primary));
  box-shadow: 5px 5px 0 var(--dashboard-level-shadow, var(--primary-shadow));
  color: var(--dashboard-level-text, #fff);
  font-family: var(--font-mono);
  line-height: 1;
}

.level-box span {
  color: var(--dashboard-level-label, var(--gold));
  font-size: 0.7rem;
  font-weight: 950;
}

.level-box strong {
  font-size: 2rem;
  font-weight: 950;
}

.player-copy {
  min-width: 0;
}

.eyebrow {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.player-copy h1 {
  margin: 2px 0 8px;
  color: var(--ink);
  font-size: clamp(1.7rem, 3vw, 2.8rem);
  font-weight: 950;
  letter-spacing: -0.02em;
}

.player-copy p:not(.eyebrow) {
  color: var(--muted);
  font-weight: 750;
}

.xp-meta {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 900;
}

.xp-meta strong {
  justify-self: center;
  color: var(--ink);
}

.xp-bar {
  height: 18px;
  margin-top: 8px;
  border: 4px solid var(--dashboard-xp-border, var(--primary-dark));
  background: var(--dashboard-xp-track, var(--primary-soft));
}

.xp-bar span {
  display: block;
  width: 72%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--dashboard-xp-fill, var(--primary)),
    var(--dashboard-xp-fill-end, var(--cyan))
  );
}

.dashboard-streak {
  padding: 0 clamp(22px, 3vw, 38px) clamp(22px, 3vw, 34px);
  background: var(--dashboard-hero-bg, transparent);
}

.section-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  color: var(--primary-dark);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 950;
  letter-spacing: 0.16em;
}

.section-heading::before {
  width: 6px;
  height: 26px;
  background: var(--primary);
  content: "";
}

.section-heading span {
  height: 3px;
  background: var(--line-soft);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  display: grid;
  min-height: 150px;
  padding: 18px;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.overview-card:hover {
  transform: translate(-2px, -2px);
}

.overview-card span,
.overview-card small {
  color: var(--muted);
  font-family: var(--font-mono);
  font-weight: 850;
}

.overview-card span {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
}

.overview-card i {
  justify-self: end;
  color: currentColor;
  font-family: var(--font-mono);
  font-style: normal;
  font-weight: 950;
}

.overview-card strong {
  align-self: end;
  color: currentColor;
  font-family: var(--font-mono);
  font-size: clamp(1.3rem, 2vw, 1.8rem);
  font-weight: 950;
}

.overview-card.tone-green {
  border-color: var(--overview-green-border, color-mix(in srgb, var(--green) 45%, var(--primary-line)));
  color: var(--overview-green, var(--green));
  box-shadow: 5px 5px 0 var(--overview-green-shadow, var(--green-dark));
}

.overview-card.tone-blue {
  border-color: var(--overview-blue-border, color-mix(in srgb, var(--blue) 45%, var(--primary-line)));
  color: var(--overview-blue, var(--blue));
  box-shadow: 5px 5px 0 var(--overview-blue-shadow, #1d4ed8);
}

.overview-card.tone-purple {
  border-color: var(--overview-purple-border, color-mix(in srgb, var(--primary) 45%, var(--primary-line)));
  color: var(--overview-purple, var(--primary));
  box-shadow: 5px 5px 0 var(--overview-purple-shadow, var(--primary-shadow));
}

.overview-card.tone-gold {
  border-color: var(--overview-gold-border, color-mix(in srgb, var(--gold) 45%, var(--primary-line)));
  color: var(--overview-gold, var(--gold));
  box-shadow: 5px 5px 0 var(--overview-gold-shadow, var(--gold-dark));
}

.overview-card.tone-red {
  border-color: var(--overview-red-border, color-mix(in srgb, var(--red) 45%, var(--primary-line)));
  color: var(--overview-red, var(--red));
  box-shadow: 5px 5px 0 var(--overview-red-shadow, var(--red-dark));
}

.dashboard-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.dashboard-card header {
  padding: 12px 18px;
  background: var(--primary);
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 950;
}

.dashboard-card ol {
  display: grid;
  gap: 12px;
  padding: 20px 20px 20px 42px;
  color: var(--muted);
  font-weight: 760;
}

@media (max-width: 1120px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .player-summary {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .overview-grid,
  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .player-summary {
    grid-template-columns: 1fr;
  }
}
</style>
