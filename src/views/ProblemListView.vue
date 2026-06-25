<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchProblemAlgorithms, fetchProblems } from '@/api/problems'

const PAGE_SIZE = 20

const problems = ref([])
const algorithms = ref([])
const loading = ref(true)
const filterLoading = ref(false)
const errorMessage = ref('')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageCursors = ref([null])
const selectedMode = ref('all')
const selectedDifficulty = ref('bronze')
const selectedAlgorithm = ref('')
const searchKeyword = ref('')
const appliedSearchKeyword = ref('')

const difficultyOptions = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' },
]

const activeFilter = computed(() => {
  if (selectedMode.value === 'difficulty') {
    return { difficulty: selectedDifficulty.value }
  }
  if (selectedMode.value === 'algorithm') {
    return { algorithm: selectedAlgorithm.value }
  }
  return {}
})

const pageNumbers = computed(() => {
  const pageCount = currentPage.value + (hasNextPage.value ? 1 : 0)
  return Array.from({ length: pageCount }, (_, index) => index + 1)
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('ko-KR')
}

const formatTimeLimit = (value) => {
  if (!value) return '-'
  return `${value}ms`
}

const displayProblemNumber = (problem) => problem.problemNumber || problem.id

const getErrorMessage = (error) => {
  if (error.response?.status === 503) {
    return '문제 저장소에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || '문제를 불러오지 못했습니다.'
}

const loadProblems = async (page = 1) => {
  const cursor = page === 1 ? null : pageCursors.value[page - 1]
  if (page > 1 && cursor === undefined) return

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchProblems({
      cursor,
      size: PAGE_SIZE,
      ...activeFilter.value,
      query: appliedSearchKeyword.value,
    })
    problems.value = response.items || []
    currentPage.value = page
    hasNextPage.value = !!response.hasNext
    if (response.hasNext) {
      pageCursors.value[page] = response.nextCursor
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const loadAlgorithms = async () => {
  filterLoading.value = true
  try {
    const response = await fetchProblemAlgorithms()
    algorithms.value = response || []
    if (!selectedAlgorithm.value && algorithms.value.length > 0) {
      selectedAlgorithm.value = algorithms.value[0].code
    }
  } catch {
    algorithms.value = []
  } finally {
    filterLoading.value = false
  }
}

const resetPagination = () => {
  currentPage.value = 1
  hasNextPage.value = false
  pageCursors.value = [null]
}

const changeMode = async (mode) => {
  selectedMode.value = mode
  resetPagination()
  await loadProblems(1)
}

const changeDifficulty = async (event) => {
  selectedDifficulty.value = event.target.value
  resetPagination()
  await loadProblems(1)
}

const changeAlgorithm = async (event) => {
  selectedAlgorithm.value = event.target.value
  resetPagination()
  await loadProblems(1)
}

const submitSearch = async () => {
  appliedSearchKeyword.value = searchKeyword.value.trim()
  resetPagination()
  await loadProblems(1)
}

const clearSearch = async () => {
  searchKeyword.value = ''
  appliedSearchKeyword.value = ''
  resetPagination()
  await loadProblems(1)
}

onMounted(async () => {
  await loadAlgorithms()
  await loadProblems()
})
</script>

<template>
  <div class="container problem-page fade-in">
    <div class="problem-top">
      <div>
        <h1 class="problem-title">문제</h1>
        <p class="problem-desc">공개된 알고리즘 문제를 확인하세요.</p>
      </div>
    </div>

    <div class="problem-filters">
      <div class="filter-tabs" aria-label="문제 필터 유형">
        <button
          type="button"
          class="filter-tab"
          :class="{ active: selectedMode === 'all' }"
          @click="changeMode('all')"
        >
          전체 문제
        </button>
        <button
          type="button"
          class="filter-tab"
          :class="{ active: selectedMode === 'difficulty' }"
          @click="changeMode('difficulty')"
        >
          난이도별
        </button>
        <button
          type="button"
          class="filter-tab"
          :class="{ active: selectedMode === 'algorithm' }"
          @click="changeMode('algorithm')"
        >
          알고리즘별
        </button>
      </div>

      <div v-if="selectedMode === 'difficulty'" class="filter-control">
        <label for="difficulty-filter">난이도</label>
        <select id="difficulty-filter" :value="selectedDifficulty" @change="changeDifficulty">
          <option v-for="difficulty in difficultyOptions" :key="difficulty.value" :value="difficulty.value">
            {{ difficulty.label }}
          </option>
        </select>
      </div>

      <div v-if="selectedMode === 'algorithm'" class="filter-control">
        <label for="algorithm-filter">알고리즘</label>
        <select
          id="algorithm-filter"
          :value="selectedAlgorithm"
          :disabled="filterLoading || algorithms.length === 0"
          @change="changeAlgorithm"
        >
          <option v-for="algorithm in algorithms" :key="algorithm.code" :value="algorithm.code">
            {{ algorithm.label }}
          </option>
        </select>
      </div>

      <form class="search-control" role="search" @submit.prevent="submitSearch">
        <label for="problem-search">문제 검색</label>
        <div class="search-input-row">
          <input
            id="problem-search"
            v-model="searchKeyword"
            type="search"
            placeholder="번호 또는 제목"
            autocomplete="off"
          />
          <button type="submit" class="btn btn-primary">검색</button>
          <button
            v-if="appliedSearchKeyword"
            type="button"
            class="btn btn-outline"
            @click="clearSearch"
          >
            초기화
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="problem-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="problem-state error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-outline" @click="loadProblems(currentPage)">다시 시도</button>
    </div>

    <template v-else>
      <div v-if="problems.length > 0" class="problem-table">
        <div class="table-header">
          <span class="col-id">#</span>
          <span class="col-title">제목</span>
          <span class="col-difficulty">난이도</span>
          <span class="col-limit">시간 제한</span>
          <span class="col-date">등록일</span>
        </div>

        <RouterLink
          v-for="problem in problems"
          :key="problem.id"
          :to="{ name: 'problem-detail', params: { problemId: problem.id } }"
          class="table-row"
        >
          <span class="col-id">{{ displayProblemNumber(problem) }}</span>
          <span class="col-title">{{ problem.title }}</span>
          <span class="col-difficulty">{{ problem.difficulty || '-' }}</span>
          <span class="col-limit">{{ formatTimeLimit(problem.timeLimitMs) }}</span>
          <span class="col-date">{{ formatDate(problem.createdAt) }}</span>
        </RouterLink>
      </div>

      <div v-else class="problem-empty">
        <p>{{ appliedSearchKeyword ? '검색 결과가 없습니다.' : '공개된 문제가 없습니다.' }}</p>
      </div>

      <div v-if="problems.length > 0" class="pagination">
        <button
          type="button"
          class="page-button"
          :disabled="currentPage === 1"
          @click="loadProblems(currentPage - 1)"
        >
          이전
        </button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="page-button"
          :class="{ active: currentPage === page }"
          @click="loadProblems(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="page-button"
          :disabled="!hasNextPage"
          @click="loadProblems(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.problem-page {
  padding: 0;
  max-width: none;
}

.problem-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-8);
  gap: var(--space-4);
}

.problem-title {
  font-size: var(--font-2xl);
  font-family: var(--font-mono);
  font-weight: 950;
  margin-bottom: var(--space-1);
}

.problem-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.problem-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.filter-tabs {
  display: inline-flex;
  border: 3px solid var(--color-border);
  background: var(--color-bg);
}

.filter-tab {
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 0;
  border-right: 2px solid var(--color-border-light);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 900;
}

.filter-tab:last-child {
  border-right: 0;
}

.filter-tab.active,
.filter-tab:hover {
  color: #fff;
  background: var(--color-primary);
}

.filter-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 800;
}

.filter-control select {
  min-width: 180px;
  height: 40px;
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 800;
}

.search-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 800;
}

.search-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search-input-row input {
  width: min(280px, 38vw);
  height: 40px;
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  padding: 0 var(--space-3);
  font-weight: 800;
}

.problem-table {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 120px 120px 120px;
  align-items: center;
  gap: var(--space-3);
  min-height: 52px;
  padding: 0 var(--space-3);
  border-bottom: 2px solid var(--color-border-light);
}

.table-header {
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  font-weight: 950;
  color: #fff;
  background: var(--color-primary);
}

.table-row {
  color: var(--color-text);
  transition: background-color var(--transition-fast);
}

.table-row:hover {
  background: var(--color-primary-light);
}

.col-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.col-id,
.col-difficulty,
.col-limit,
.col-date {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.col-id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-code);
}

.problem-state,
.problem-empty {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-6);
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-8);
}

.page-button {
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-3);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  font-weight: 900;
}

.page-button:hover:not(:disabled),
.page-button.active {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

.page-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 720px) {
  .problem-page {
    padding: var(--space-8) var(--space-4);
  }

  .problem-filters {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-tab {
    padding: 0 var(--space-2);
  }

  .filter-control {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-control select {
    width: 100%;
  }

  .search-control {
    align-items: stretch;
    flex-direction: column;
    margin-left: 0;
  }

  .search-input-row {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input-row input {
    width: 100%;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
    padding: var(--space-4) var(--space-2);
  }

  .col-id {
    order: 2;
  }

  .col-limit,
  .col-difficulty,
  .col-date {
    order: 3;
  }
}
</style>
