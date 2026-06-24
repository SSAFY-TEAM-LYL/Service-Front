<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchMemberRankings } from '@/api/members'
import { useAuthStore } from '@/stores/auth'

const PAGE_SIZE = 20

const auth = useAuthStore()

const rankings = ref([])
const currentPage = ref(0)
const hasNextPage = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const failedImages = ref(new Set())

const podium = computed(() => rankings.value.slice(0, 3))
const rankedRows = computed(() => rankings.value.slice(3))
const hasPreviousPage = computed(() => currentPage.value > 0)

const loadRankings = async (page = 0) => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchMemberRankings({ page, size: PAGE_SIZE })
    rankings.value = response.items || []
    currentPage.value = response.page || 0
    hasNextPage.value = response.hasNext
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '랭킹을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const avatarInitial = (member) => (member?.nickname || '?').slice(0, 1).toUpperCase()

const canShowImage = (member) => {
  return member?.profileImageUrl && !failedImages.value.has(member.memberId)
}

const markImageFailed = (memberId) => {
  failedImages.value = new Set([...failedImages.value, memberId])
}

const isMe = (member) => auth.user?.id && member.memberId === auth.user.id

onMounted(() => {
  loadRankings()
})
</script>

<template>
  <div class="container ranking-page fade-in">
    <header class="ranking-top">
      <div>
        <h1 class="ranking-title">랭킹</h1>
        <p class="ranking-desc">XP 기준으로 정렬된 전체 사용자 순위입니다.</p>
      </div>
      <div class="ranking-rule">
        <span>LEVEL</span>
        <strong>50 XP = 1 LV</strong>
      </div>
    </header>

    <div v-if="loading" class="ranking-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="ranking-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-outline" @click="loadRankings(currentPage)">
        다시 시도
      </button>
    </div>

    <template v-else>
      <section v-if="podium.length > 0" class="podium-grid" aria-label="상위 랭킹">
        <article
          v-for="member in podium"
          :key="member.memberId"
          class="podium-card"
          :class="[`rank-${member.rank}`, { me: isMe(member) }]"
        >
          <span class="rank-chip">#{{ member.rank }}</span>
          <div class="ranking-avatar podium-avatar">
            <img
              v-if="canShowImage(member)"
              :src="member.profileImageUrl"
              :alt="`${member.nickname} 프로필`"
              @error="markImageFailed(member.memberId)"
            />
            <span v-else>{{ avatarInitial(member) }}</span>
          </div>
          <strong>{{ member.nickname }}</strong>
          <dl>
            <div>
              <dt>XP</dt>
              <dd>{{ member.xp }}</dd>
            </div>
            <div>
              <dt>LV</dt>
              <dd>{{ member.level }}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section v-if="rankings.length > 0" class="ranking-table" aria-label="사용자 랭킹 목록">
        <div class="table-header">
          <span class="col-rank">순위</span>
          <span class="col-user">사용자</span>
          <span class="col-level">레벨</span>
          <span class="col-xp">XP</span>
        </div>

        <article
          v-for="member in rankedRows"
          :key="member.memberId"
          class="table-row"
          :class="{ me: isMe(member) }"
        >
          <span class="col-rank">#{{ member.rank }}</span>
          <span class="col-user">
            <span class="ranking-avatar">
              <img
                v-if="canShowImage(member)"
                :src="member.profileImageUrl"
                :alt="`${member.nickname} 프로필`"
                @error="markImageFailed(member.memberId)"
              />
              <span v-else>{{ avatarInitial(member) }}</span>
            </span>
            <strong>{{ member.nickname }}</strong>
            <small v-if="isMe(member)">ME</small>
          </span>
          <span class="col-level">Lv. {{ member.level }}</span>
          <span class="col-xp">{{ member.xp }} XP</span>
        </article>
      </section>

      <div v-else class="ranking-state">
        <p>아직 랭킹에 표시할 사용자가 없습니다.</p>
      </div>

      <div class="pagination" v-if="rankings.length > 0">
        <button
          type="button"
          class="page-button"
          :disabled="!hasPreviousPage"
          @click="loadRankings(currentPage - 1)"
        >
          이전
        </button>
        <span class="page-current">{{ currentPage + 1 }}</span>
        <button
          type="button"
          class="page-button"
          :disabled="!hasNextPage"
          @click="loadRankings(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ranking-page {
  display: grid;
  gap: var(--space-6);
  padding: 0;
}

.ranking-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.ranking-title {
  margin-bottom: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--font-2xl);
  font-weight: 950;
}

.ranking-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.ranking-rule {
  display: grid;
  gap: 4px;
  min-width: 178px;
  padding: var(--space-3) var(--space-4);
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-mono);
  text-align: right;
}

.ranking-rule span {
  color: var(--color-text-muted);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-rule strong {
  color: var(--color-primary-dark);
  font-size: var(--font-sm);
  font-weight: 950;
}

.podium-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.podium-card,
.ranking-table,
.ranking-state {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.podium-card {
  position: relative;
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  min-height: 238px;
  padding: var(--space-6);
  overflow: hidden;
}

.podium-card.rank-1 {
  border-color: var(--gold);
  box-shadow: 5px 5px 0 var(--gold-dark);
}

.podium-card.rank-2 {
  border-color: var(--blue);
}

.podium-card.rank-3 {
  border-color: var(--green);
}

.podium-card.me,
.table-row.me {
  background: var(--color-primary-light);
}

.rank-chip {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  padding: 4px 9px;
  border: 2px solid currentColor;
  color: var(--color-primary-dark);
  background: var(--color-bg);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.ranking-avatar {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 3px solid var(--color-border);
  background: var(--color-primary);
  box-shadow: 3px 3px 0 var(--color-border-light);
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 950;
  overflow: hidden;
}

.ranking-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.podium-avatar {
  width: 76px;
  height: 76px;
  margin-top: var(--space-4);
  font-size: var(--font-2xl);
}

.podium-card strong {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--font-xl);
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
}

.podium-card dl div {
  padding: var(--space-3);
  border: 2px solid var(--color-border-light);
  background: var(--color-surface);
  text-align: center;
}

.podium-card dt {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 900;
}

.podium-card dd {
  margin-top: 2px;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-weight: 950;
}

.ranking-table {
  display: grid;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 120px 140px;
  align-items: center;
  gap: var(--space-3);
  min-height: 58px;
  padding: 0 var(--space-4);
  border-bottom: 2px solid var(--color-border-light);
}

.table-header {
  border-bottom: 3px solid var(--color-primary-dark);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.table-row:last-child {
  border-bottom: 0;
}

.col-rank,
.col-level,
.col-xp {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 900;
}

.col-user {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-3);
}

.col-user strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-user small {
  padding: 2px 7px;
  border: 2px solid var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 950;
}

.ranking-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-6);
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.page-button,
.page-current {
  min-width: 42px;
  height: 36px;
  padding: 0 var(--space-3);
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 900;
}

.page-current {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

.page-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}

@media (max-width: 900px) {
  .podium-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 72px minmax(0, 1fr) 92px;
  }

  .col-level {
    display: none;
  }
}

@media (max-width: 640px) {
  .ranking-top {
    align-items: stretch;
    flex-direction: column;
  }

  .ranking-rule {
    text-align: left;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 62px minmax(0, 1fr);
    padding: var(--space-3);
  }

  .col-xp {
    grid-column: 2;
  }
}
</style>
