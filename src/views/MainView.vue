<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMySolvedStats } from '@/api/members'
import { fetchMyStreak } from '@/api/streaks'
import DailyStreakGrass from '@/components/DailyStreakGrass.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const XP_PER_LEVEL = 50
const DIFFICULTY_COLORS = {
  bronze: '#b45309',
  silver: '#496982',
  gold: '#f59e0b',
  platinum: '#14b8a6',
  diamond: '#0ea5e9',
}

const heroName = computed(() => auth.user?.nickname || '사용자')
const streak = ref(null)
const isLoadingStreak = ref(false)
const streakError = ref('')
const solvedStats = ref(null)
const isLoadingSolvedStats = ref(false)
const solvedStatsError = ref('')

const currentXp = computed(() => Number(auth.user?.xp) || 0)
const currentLevel = computed(() => Number(auth.user?.level) || Math.floor(currentXp.value / XP_PER_LEVEL) + 1)
const currentLevelXp = computed(() => currentXp.value % XP_PER_LEVEL)
const nextLevelXp = computed(() => XP_PER_LEVEL - currentLevelXp.value)
const xpProgressPercent = computed(() => Math.min(100, Math.max(0, (currentLevelXp.value / XP_PER_LEVEL) * 100)))
const xpProgressText = computed(() => `${currentLevelXp.value} / ${XP_PER_LEVEL} XP`)
const xpStatusMessage = computed(() => {
  return `현재 경험치 : ${currentXp.value} XP, Lv. ${currentLevel.value + 1}까지 ${nextLevelXp.value} XP 남았습니다! 화이팅!`
})

const avatarInitial = computed(() => heroName.value.trim().slice(0, 1).toUpperCase() || 'U')
const solvedProblemCount = computed(() => Number(solvedStats.value?.totalSolvedCount) || 0)
const difficultyStats = computed(() => {
  return (solvedStats.value?.difficulties || []).map((item) => ({
    key: item.tier,
    label: item.label,
    solved: Number(item.solvedCount) || 0,
    percent: Number(item.percent) || 0,
    color: DIFFICULTY_COLORS[item.tier] || 'var(--primary)',
    levels: item.levels || [],
  }))
})
const algorithmStats = computed(() => {
  return (solvedStats.value?.algorithms || []).map((item) => ({
    code: item.code,
    label: item.label,
    solved: Number(item.solvedCount) || 0,
    percent: Number(item.percent) || 0,
  }))
})
const maxAlgorithmSolved = computed(() => Math.max(1, ...algorithmStats.value.map((item) => item.solved)))
const topAlgorithmStats = computed(() => {
  return [...algorithmStats.value]
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 6)
})
const donutGradient = computed(() => {
  if (solvedProblemCount.value <= 0) {
    return 'conic-gradient(var(--line-soft) 0% 100%)'
  }
  let cursor = 0
  const segments = difficultyStats.value
    .filter((item) => item.percent > 0)
    .map((item) => {
      const start = cursor
      cursor += item.percent
      return `${item.color} ${start}% ${cursor}%`
    })

  return `conic-gradient(${segments.join(', ')})`
})

const radarPoints = computed(() => {
  const center = 50
  const radius = 41
  if (topAlgorithmStats.value.length === 0) {
    return ''
  }
  return topAlgorithmStats.value
    .map((item, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / topAlgorithmStats.value.length
      const distance = (item.solved / maxAlgorithmSolved.value) * radius
      const x = center + Math.cos(angle) * distance
      const y = center + Math.sin(angle) * distance
      return `${x},${y}`
    })
    .join(' ')
})

const radarAxis = computed(() => {
  const center = 50
  const radius = 43
  return topAlgorithmStats.value.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / topAlgorithmStats.value.length
    return {
      ...item,
      lineX: center + Math.cos(angle) * radius,
      lineY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * 49,
      labelY: center + Math.sin(angle) * 49,
    }
  })
})

const visibleAlgorithmStats = computed(() => {
  return [...algorithmStats.value].sort((a, b) => b.solved - a.solved || a.label.localeCompare(b.label))
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

const loadSolvedStats = async () => {
  if (!auth.isLoggedIn) {
    solvedStats.value = null
    return
  }

  isLoadingSolvedStats.value = true
  solvedStatsError.value = ''
  try {
    solvedStats.value = await fetchMySolvedStats()
  } catch (error) {
    solvedStatsError.value = error.response?.data?.message || '푼 문제 통계를 불러오지 못했습니다.'
  } finally {
    isLoadingSolvedStats.value = false
  }
}

watch(
  () => auth.isLoggedIn,
  () => {
    loadStreak()
    loadSolvedStats()
  },
)

onMounted(() => {
  loadStreak()
  loadSolvedStats()
})
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
      <strong>SOLVED STATS</strong>
      <span />
    </section>

    <section
      v-if="isLoadingSolvedStats || solvedStatsError"
      class="dashboard-panel stats-state"
      aria-live="polite"
    >
      <p v-if="isLoadingSolvedStats">푼 문제 통계를 불러오는 중입니다.</p>
      <p v-else>{{ solvedStatsError }}</p>
    </section>

    <section v-else class="solved-stats-grid" aria-label="푼 문제 통계">
      <article class="dashboard-panel stats-panel">
        <header class="stats-header">
          <span>◎ 난이도 분포</span>
          <strong>{{ solvedProblemCount }}문제 해결</strong>
          <RouterLink to="/problems" class="btn btn-sm btn-outline">자세히</RouterLink>
        </header>

        <div class="stats-content difficulty-layout">
          <div class="donut-chart" :style="{ background: donutGradient }" aria-hidden="true">
            <div class="donut-hole">
              <img
                v-if="auth.user?.profileImageUrl"
                :src="auth.user.profileImageUrl"
                :alt="`${heroName} 프로필 이미지`"
              />
              <span v-else>{{ avatarInitial }}</span>
            </div>
          </div>

          <div class="stats-table-wrap">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>레벨</th>
                  <th>문제</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in difficultyStats" :key="item.key">
                  <td :style="{ color: item.color }">
                    {{ item.label }}
                    <small class="difficulty-levels">
                      {{ item.levels.map((level) => `${level.level} ${level.solvedCount}`).join(' · ') }}
                    </small>
                  </td>
                  <td>{{ item.solved }}</td>
                  <td>{{ item.percent.toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <article class="dashboard-panel stats-panel">
        <header class="stats-header">
          <span>◇ 알고리즘 유형</span>
          <strong>자주 푼 태그</strong>
          <RouterLink to="/problems" class="btn btn-sm btn-outline">더 보기</RouterLink>
        </header>

        <div class="stats-content algorithm-layout">
          <div class="radar-chart" aria-hidden="true">
            <svg viewBox="0 0 100 100" role="img">
              <circle cx="50" cy="50" r="12" />
              <circle cx="50" cy="50" r="24" />
              <circle cx="50" cy="50" r="36" />
              <line
                v-for="axis in radarAxis"
                :key="axis.code"
                x1="50"
                y1="50"
                :x2="axis.lineX"
                :y2="axis.lineY"
              />
              <polygon :points="radarPoints" />
              <text
                v-for="axis in radarAxis"
                :key="`${axis.code}-label`"
                :x="axis.labelX"
                :y="axis.labelY"
              >
                {{ axis.code }}
              </text>
            </svg>
            <div class="radar-avatar">
              <img
                v-if="auth.user?.profileImageUrl"
                :src="auth.user.profileImageUrl"
                :alt="`${heroName} 프로필 이미지`"
              />
              <span v-else>{{ avatarInitial }}</span>
            </div>
          </div>

          <div class="stats-table-wrap">
            <table class="stats-table algorithm-table">
              <thead>
                <tr>
                  <th>태그</th>
                  <th>문제</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in visibleAlgorithmStats" :key="item.code">
                  <td>#{{ item.label }}</td>
                  <td>
                    <strong>{{ item.solved }}</strong>
                  </td>
                  <td>{{ item.percent.toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
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
.dashboard-card {
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

.solved-stats-grid {
  display: grid;
  gap: 22px;
}

.stats-panel {
  overflow: hidden;
}

.stats-state {
  padding: 22px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-weight: 900;
}

.stats-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 14px;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 3px solid var(--line-soft);
  background: var(--surface-panel);
}

.stats-header span {
  grid-column: 1 / -1;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 900;
}

.stats-header strong {
  color: var(--ink);
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  font-weight: 950;
}

.stats-header .btn {
  justify-self: end;
}

.stats-content {
  display: grid;
  grid-template-columns: minmax(230px, 0.65fr) minmax(0, 1.35fr);
  gap: clamp(20px, 4vw, 52px);
  align-items: center;
  padding: clamp(22px, 3vw, 34px);
}

.donut-chart {
  position: relative;
  justify-self: center;
  width: min(100%, 280px);
  aspect-ratio: 1;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 8%, transparent);
}

.donut-chart::before {
  position: absolute;
  inset: 26%;
  border-radius: 50%;
  background: var(--surface-plain);
  content: "";
}

.donut-hole,
.radar-avatar {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 3px solid var(--primary-line);
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 950;
}

.donut-hole {
  inset: 42%;
  box-shadow: 3px 3px 0 var(--line-soft);
}

.donut-hole img,
.radar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 0.84rem;
}

.stats-table th,
.stats-table td {
  padding: 10px 12px;
  border-bottom: 2px solid var(--line-soft);
  text-align: right;
  vertical-align: middle;
}

.stats-table th:first-child,
.stats-table td:first-child {
  text-align: left;
}

.stats-table th {
  color: var(--ink);
  font-size: 0.74rem;
  font-weight: 950;
}

.stats-table td {
  color: var(--muted);
  font-weight: 850;
}

.stats-table td:first-child,
.stats-table td:nth-child(2) {
  color: var(--ink);
  font-weight: 950;
}

.difficulty-levels {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.algorithm-layout {
  grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.25fr);
}

.radar-chart {
  position: relative;
  justify-self: center;
  width: min(100%, 310px);
  aspect-ratio: 1;
}

.radar-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.radar-chart circle {
  fill: none;
  stroke: var(--line-soft);
  stroke-dasharray: 3 3;
  stroke-width: 0.8;
}

.radar-chart line {
  stroke: var(--line-soft);
  stroke-dasharray: 3 3;
  stroke-width: 0.7;
}

.radar-chart polygon {
  fill: color-mix(in srgb, var(--gold) 24%, transparent);
  stroke: var(--gold);
  stroke-linejoin: round;
  stroke-width: 1.3;
}

.radar-chart text {
  fill: var(--ink);
  font-family: var(--font-mono);
  font-size: 4px;
  font-weight: 850;
  text-anchor: middle;
}

.radar-avatar {
  top: 50%;
  left: 50%;
  width: 42px;
  height: 42px;
  transform: translate(-50%, -50%);
  box-shadow: 2px 2px 0 var(--line-soft);
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
  .player-summary {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .stats-content,
  .algorithm-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .player-summary {
    grid-template-columns: 1fr;
  }

  .stats-header {
    grid-template-columns: 1fr;
  }

  .stats-header .btn {
    justify-self: start;
  }

  .stats-table-wrap {
    overflow-x: auto;
  }

  .stats-table {
    min-width: 520px;
  }
}
</style>
