<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchMemberRankings } from '@/api/members'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const rankings = ref([])
const myRanking = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const failedImages = ref(new Set())

const topTenRows = computed(() => rankings.value.slice(0, 10))
const podiumRows = computed(() => {
  const first = topTenRows.value.find((member) => member.rank === 1)
  const second = topTenRows.value.find((member) => member.rank === 2)
  const third = topTenRows.value.find((member) => member.rank === 3)
  return [second, first, third].filter(Boolean)
})
const currentMemberRanking = computed(() => {
  return myRanking.value || topTenRows.value.find((member) => isMe(member)) || null
})
const shouldShowMyRankingOutsideTop = computed(() => {
  if (!currentMemberRanking.value) return false
  return !topTenRows.value.some((member) => member.memberId === currentMemberRanking.value.memberId)
})
const myXp = computed(() => Number(currentMemberRanking.value?.xp ?? auth.user?.xp) || 0)

const loadRankings = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchMemberRankings()
    rankings.value = response.items || []
    myRanking.value = response.myRanking || null
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '랭킹을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function formatNumber(value = 0) {
  return Number(value || 0).toLocaleString('ko-KR')
}

const avatarInitial = (member) => (member?.nickname || '?').slice(0, 1).toUpperCase()

const canShowImage = (member) => {
  return member?.profileImageUrl && !failedImages.value.has(member.memberId)
}

const markImageFailed = (memberId) => {
  failedImages.value = new Set([...failedImages.value, memberId])
}

const isMe = (member) => auth.user?.id && member?.memberId === auth.user.id

const rankLabel = (rank) => `#${formatNumber(rank)}`

const podiumClass = (rank) => {
  if (rank === 1) return 'is-gold'
  if (rank === 2) return 'is-silver'
  if (rank === 3) return 'is-bronze'
  return ''
}

onMounted(() => {
  loadRankings()
})
</script>

<template>
  <div class="container ranking-page fade-in">
    <header class="ranking-hero">
      <div class="ranking-title-block">
        <span class="ranking-emblem" aria-hidden="true">★</span>
        <div>
          <span class="ranking-kicker">GLOBAL XP RANKING</span>
          <h1>전체 유저 랭킹</h1>
        </div>
      </div>

      <dl class="ranking-summary" aria-label="내 랭킹 요약">
        <div>
          <dt>내 순위</dt>
          <dd>{{ currentMemberRanking ? rankLabel(currentMemberRanking.rank) : '-' }}</dd>
        </div>
        <div>
          <dt>내 XP</dt>
          <dd>{{ formatNumber(myXp) }}</dd>
        </div>
      </dl>
    </header>

    <div v-if="loading" class="ranking-state">
      <p>랭킹을 불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="ranking-state error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-outline" @click="loadRankings">다시 시도</button>
    </div>

    <template v-else>
      <section v-if="podiumRows.length > 0" class="hall-of-fame" aria-label="명예의 전당 TOP 3">
        <div class="hall-heading">
          <span>TOP 3</span>
          <h2>명예의 전당</h2>
        </div>

        <div class="medal-stage">
          <article
            v-for="member in podiumRows"
            :key="`podium-${member.memberId}`"
            class="medal-card"
            :class="[podiumClass(member.rank), { 'is-me': isMe(member) }]"
          >
            <span class="medal-disc" aria-hidden="true">{{ member.rank }}</span>
            <span class="ranking-avatar podium-avatar">
              <img
                v-if="canShowImage(member)"
                :src="member.profileImageUrl"
                :alt="`${member.nickname} 프로필`"
                @error="markImageFailed(member.memberId)"
              />
              <span v-else>{{ avatarInitial(member) }}</span>
            </span>
            <strong>{{ member.nickname }}</strong>
            <span>{{ formatNumber(member.xp) }} XP</span>
          </article>
        </div>
      </section>

      <section v-if="topTenRows.length > 0" class="ranking-board" aria-label="전체 사용자 TOP 10 랭킹">
        <div class="ranking-table-head">
          <span>순위</span>
          <span>사용자</span>
          <span>레벨</span>
          <span>XP</span>
        </div>

        <article
          v-for="member in topTenRows"
          :key="member.memberId"
          class="ranking-row"
          :class="{ 'is-me': isMe(member) }"
        >
          <span class="ranking-place">{{ rankLabel(member.rank) }}</span>
          <span class="ranking-user">
            <span class="ranking-avatar">
              <img
                v-if="canShowImage(member)"
                :src="member.profileImageUrl"
                :alt="`${member.nickname} 프로필`"
                @error="markImageFailed(member.memberId)"
              />
              <span v-else>{{ avatarInitial(member) }}</span>
            </span>
            <span class="ranking-name">
              <strong>{{ member.nickname }}</strong>
              <small v-if="isMe(member)">ME</small>
            </span>
          </span>
          <span class="ranking-level">Lv. {{ member.level }}</span>
          <strong class="ranking-xp">{{ formatNumber(member.xp) }} XP</strong>
        </article>
      </section>

      <section v-if="shouldShowMyRankingOutsideTop" class="my-rank-panel" aria-label="내 순위">
        <span class="outside-label">내 순위</span>
        <article class="ranking-row is-me is-outside">
          <span class="ranking-place">{{ rankLabel(currentMemberRanking.rank) }}</span>
          <span class="ranking-user">
            <span class="ranking-avatar">
              <img
                v-if="canShowImage(currentMemberRanking)"
                :src="currentMemberRanking.profileImageUrl"
                :alt="`${currentMemberRanking.nickname} 프로필`"
                @error="markImageFailed(currentMemberRanking.memberId)"
              />
              <span v-else>{{ avatarInitial(currentMemberRanking) }}</span>
            </span>
            <span class="ranking-name">
              <strong>{{ currentMemberRanking.nickname }}</strong>
              <small>ME</small>
            </span>
          </span>
          <span class="ranking-level">Lv. {{ currentMemberRanking.level }}</span>
          <strong class="ranking-xp">{{ formatNumber(currentMemberRanking.xp) }} XP</strong>
        </article>
      </section>

      <div v-if="topTenRows.length === 0" class="ranking-state">
        <p>아직 랭킹에 표시할 사용자가 없습니다.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ranking-page {
  display: grid;
  gap: var(--space-7);
  width: min(100%, 1060px);
  padding: 0;
}

.ranking-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.ranking-title-block {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-4);
}

.ranking-emblem {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border: 3px solid var(--color-border);
  background: var(--color-primary);
  box-shadow: var(--shadow-md);
  color: #fff;
  font-family: var(--font-mono);
  font-size: var(--font-xl);
  font-weight: 950;
}

.ranking-kicker {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-title-block h1 {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: var(--font-2xl);
  font-weight: 950;
  line-height: 1.15;
}

.ranking-title-block p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.ranking-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(106px, 1fr));
  min-width: min(100%, 300px);
  margin: 0;
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.ranking-summary div {
  display: grid;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
}

.ranking-summary div + div {
  border-left: 2px solid var(--color-border);
}

.ranking-summary dt {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 900;
}

.ranking-summary dd {
  margin: 0;
  color: var(--color-primary-dark);
  font-family: var(--font-mono);
  font-size: var(--font-lg);
  font-weight: 950;
}

.hall-of-fame {
  display: grid;
  gap: var(--space-4);
}

.hall-heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.hall-heading span {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.hall-heading h2 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-xl);
  font-weight: 950;
}

.medal-stage {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: var(--space-5);
  min-height: 300px;
}

.medal-card {
  --medal-main: var(--color-primary);
  --medal-soft: var(--color-primary-light);
  --medal-shadow: var(--color-border-light);
  --ribbon-left: color-mix(in oklch, var(--medal-main) 78%, #111827 22%);
  --ribbon-right: color-mix(in oklch, var(--medal-main) 68%, white 32%);
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-5);
  border: 3px solid var(--medal-main);
  background: var(--color-bg);
  box-shadow: 5px 5px 0 var(--medal-shadow);
  text-align: center;
}

.medal-card.is-gold {
  --medal-main: var(--gold);
  --medal-soft: #fff6d8;
  --medal-shadow: var(--gold-dark);
  min-height: 286px;
}

.medal-card.is-silver {
  --medal-main: #94a3b8;
  --medal-soft: #f1f5f9;
  --medal-shadow: #cbd5e1;
  min-height: 246px;
}

.medal-card.is-bronze {
  --medal-main: #b45309;
  --medal-soft: #ffedd5;
  --medal-shadow: #fed7aa;
  min-height: 226px;
}

.medal-card.is-me {
  background: color-mix(in oklch, var(--gold) 14%, var(--color-bg) 86%);
}

.medal-disc {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-top: 34px;
  border: 5px solid var(--medal-main);
  border-radius: 50%;
  background: var(--medal-soft);
  box-shadow:
    inset 0 0 0 6px rgb(255 255 255 / 0.72),
    inset 0 -8px 0 rgb(0 0 0 / 0.08),
    5px 5px 0 var(--medal-shadow);
  color: var(--medal-main);
  font-family: var(--font-mono);
  font-size: var(--font-2xl);
  font-weight: 950;
}

.medal-disc::before,
.medal-disc::after {
  position: absolute;
  top: -40px;
  width: 24px;
  height: 48px;
  border: 3px solid var(--medal-main);
  background: var(--ribbon-left);
  content: '';
}

.medal-disc::before {
  left: 12px;
  transform: skewX(-16deg);
}

.medal-disc::after {
  right: 12px;
  background: var(--ribbon-right);
  transform: skewX(16deg);
}

.ranking-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border: 3px solid var(--color-border);
  background: var(--color-primary);
  box-shadow: var(--shadow-sm);
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 950;
  overflow: hidden;
}

.ranking-avatar img {
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  object-fit: contain;
}

.podium-avatar {
  width: 72px;
  height: 72px;
  border-color: var(--medal-main);
  background: var(--medal-soft);
  box-shadow: 4px 4px 0 var(--medal-shadow);
  color: var(--medal-main);
  font-size: var(--font-xl);
}

.medal-card strong {
  overflow: hidden;
  max-width: 100%;
  font-family: var(--font-mono);
  font-size: var(--font-lg);
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.medal-card > span:last-child {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 900;
}

.ranking-board,
.ranking-state,
.my-rank-panel {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.ranking-board,
.my-rank-panel {
  overflow-x: auto;
}

.ranking-table-head,
.ranking-row {
  display: grid;
  grid-template-columns: 92px minmax(190px, 1.35fr) 120px 150px;
  align-items: center;
  gap: var(--space-4);
  min-width: 660px;
  padding: 0 var(--space-5);
}

.ranking-table-head {
  min-height: 56px;
  border-bottom: 3px solid var(--color-primary-dark);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-row {
  min-height: 72px;
  border-bottom: 2px solid var(--color-border-light);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.ranking-row:hover {
  background: color-mix(in oklch, var(--color-primary-light) 52%, white 48%);
  transform: translateX(2px);
}

.ranking-row:last-child {
  border-bottom: 0;
}

.ranking-row.is-me {
  background: color-mix(in oklch, var(--gold) 18%, var(--color-bg) 82%);
  box-shadow: inset 5px 0 0 var(--gold);
}

.ranking-row.is-outside {
  border-top: 2px solid var(--color-border-light);
}

.ranking-place {
  display: inline-grid;
  place-items: center;
  justify-self: start;
  min-width: 42px;
  min-height: 30px;
  padding: 4px 8px;
  border: 2px solid var(--color-border);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-user,
.ranking-name {
  display: flex;
  align-items: center;
  min-width: 0;
}

.ranking-user {
  gap: var(--space-3);
}

.ranking-name {
  gap: var(--space-2);
}

.ranking-name strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-name small {
  padding: 2px 7px;
  border: 2px solid var(--gold);
  background: #fff8db;
  color: var(--gold-dark);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 950;
}

.ranking-level,
.ranking-xp {
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 950;
}

.ranking-level {
  color: var(--color-text-secondary);
}

.ranking-xp {
  color: var(--color-primary-dark);
}

.outside-label {
  display: block;
  min-width: 660px;
  padding: var(--space-3) var(--space-5);
  border-bottom: 2px solid var(--color-border-light);
  color: var(--color-primary-dark);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-6);
  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 900px) {
  .ranking-hero {
    display: grid;
    align-items: stretch;
  }

  .ranking-summary {
    width: 100%;
  }

  .medal-stage {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .medal-card,
  .medal-card.is-gold,
  .medal-card.is-silver,
  .medal-card.is-bronze {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    justify-items: start;
    min-height: 0;
    text-align: left;
  }

  .medal-disc {
    width: 52px;
    height: 52px;
    margin-top: 28px;
    font-size: var(--font-lg);
  }

  .medal-disc::before,
  .medal-disc::after {
    top: -32px;
    width: 18px;
    height: 38px;
  }

  .podium-avatar {
    width: 48px;
    height: 48px;
    font-size: var(--font-base);
  }
}

@media (max-width: 640px) {
  .ranking-title-block {
    align-items: flex-start;
  }

  .ranking-emblem {
    width: 46px;
    height: 46px;
  }

  .ranking-title-block h1 {
    font-size: var(--font-xl);
  }

  .ranking-summary {
    grid-template-columns: 1fr;
  }

  .ranking-summary div + div {
    border-top: 2px solid var(--color-border);
    border-left: 0;
  }
}
</style>
