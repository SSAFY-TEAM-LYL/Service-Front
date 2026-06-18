<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchProblems } from '@/api/problems'

const PAGE_SIZE = 20

const problems = ref([])
const loading = ref(true)
const errorMessage = ref('')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageCursors = ref([null])

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

onMounted(loadProblems)
</script>

<template>
  <div class="container problem-page fade-in">
    <div class="problem-top">
      <div>
        <h1 class="problem-title">문제</h1>
        <p class="problem-desc">공개된 알고리즘 문제를 확인하세요.</p>
      </div>
    </div>

    <div v-if="loading" class="problem-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="problem-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-outline" @click="loadProblems(currentPage)">다시 시도</button>
    </div>

    <template v-else>
      <div v-if="problems.length > 0" class="problem-table">
        <div class="table-header">
          <span class="col-id">#</span>
          <span class="col-title">제목</span>
          <span class="col-limit">시간 제한</span>
          <span class="col-date">등록일</span>
        </div>

        <RouterLink
          v-for="problem in problems"
          :key="problem.id"
          :to="{ name: 'problem-detail', params: { problemId: problem.id } }"
          class="table-row"
        >
          <span class="col-id">{{ problem.id }}</span>
          <span class="col-title">{{ problem.title }}</span>
          <span class="col-limit">{{ formatTimeLimit(problem.timeLimitMs) }}</span>
          <span class="col-date">{{ formatDate(problem.createdAt) }}</span>
        </RouterLink>
      </div>

      <div v-else class="problem-empty">
        <p>공개된 문제가 없습니다.</p>
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
  max-width: 1180px;
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

.problem-table {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 120px 120px;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  .col-date {
    order: 3;
  }
}
</style>
