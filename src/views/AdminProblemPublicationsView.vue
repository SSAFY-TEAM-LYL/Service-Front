<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  fetchProblemBankProblems,
  publishProblem,
  unpublishProblem,
} from '@/api/adminProblemPublications'

const PAGE_SIZE = 20

const problems = ref([])
const loading = ref(true)
const actionProblemId = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const currentPage = ref(0)
const hasNextPage = ref(false)

const visiblePage = computed(() => currentPage.value + 1)
const pageNumbers = computed(() => {
  const pageCount = visiblePage.value + (hasNextPage.value ? 1 : 0)
  return Array.from({ length: pageCount }, (_, index) => index)
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

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 503) {
    return '문제 저장소에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || fallback
}

const loadProblems = async (page = 0) => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchProblemBankProblems({
      page,
      size: PAGE_SIZE,
    })
    problems.value = response.items || []
    currentPage.value = response.page ?? page
    hasNextPage.value = !!response.hasNext
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '등록 가능한 문제 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const setProblemPublished = (problemId, published) => {
  problems.value = problems.value.map((problem) => (
    problem.id === problemId ? { ...problem, published } : problem
  ))
}

const publish = async (problem) => {
  actionProblemId.value = problem.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await publishProblem({ problemId: problem.id })
    setProblemPublished(problem.id, true)
    successMessage.value = '문제를 공개 등록했습니다.'
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '문제 공개 등록에 실패했습니다.')
  } finally {
    actionProblemId.value = null
  }
}

const unpublish = async (problem) => {
  if (!confirm('이 문제를 공개 목록에서 제외하시겠습니까?')) return

  actionProblemId.value = problem.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await unpublishProblem(problem.id)
    setProblemPublished(problem.id, false)
    successMessage.value = '문제를 공개 목록에서 제외했습니다.'
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '문제 공개 해제에 실패했습니다.')
  } finally {
    actionProblemId.value = null
  }
}

onMounted(loadProblems)
</script>

<template>
  <div class="container admin-page fade-in">
    <div class="admin-top">
      <div>
        <h1 class="admin-title">문제 관리</h1>
        <p class="admin-desc">서비스에 노출할 문제를 선택하세요.</p>
      </div>
    </div>

    <p v-if="successMessage" class="success-text">{{ successMessage }}</p>

    <div v-if="loading" class="admin-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage && problems.length === 0" class="admin-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn btn-outline" @click="loadProblems(currentPage)">다시 시도</button>
    </div>

    <template v-else>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div v-if="problems.length > 0" class="problem-table">
        <div class="table-header">
          <span class="col-id">Problem ID</span>
          <span class="col-title">제목</span>
          <span class="col-limit">시간 제한</span>
          <span class="col-date">생성일</span>
          <span class="col-status">상태</span>
          <span class="col-action">작업</span>
        </div>

        <div v-for="problem in problems" :key="problem.id" class="table-row">
          <span class="col-id">{{ problem.id }}</span>
          <span class="col-title">{{ problem.title }}</span>
          <span class="col-limit">{{ formatTimeLimit(problem.timeLimitMs) }}</span>
          <span class="col-date">{{ formatDate(problem.createdAt) }}</span>
          <span class="col-status">
            <span class="status-badge" :class="{ inactive: !problem.published }">
              {{ problem.published ? '공개' : '미공개' }}
            </span>
          </span>
          <span class="col-action">
            <button
              v-if="problem.published"
              type="button"
              class="btn btn-outline btn-sm"
              :disabled="actionProblemId === problem.id"
              @click="unpublish(problem)"
            >
              {{ actionProblemId === problem.id ? '처리 중...' : '공개 해제' }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="actionProblemId === problem.id"
              @click="publish(problem)"
            >
              {{ actionProblemId === problem.id ? '처리 중...' : '공개 등록' }}
            </button>
          </span>
        </div>
      </div>

      <div v-else class="admin-state">
        <p>등록 가능한 문제가 없습니다.</p>
      </div>

      <div v-if="problems.length > 0" class="pagination">
        <button
          type="button"
          class="page-button"
          :disabled="currentPage === 0"
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
          {{ page + 1 }}
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
.admin-page {
  padding: 0;
  max-width: none;
}

.admin-top {
  margin-bottom: var(--space-8);
}

.admin-title {
  font-size: var(--font-2xl);
  font-family: var(--font-mono);
  font-weight: 950;
  margin-bottom: var(--space-1);
}

.admin-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.success-text,
.error-banner {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 3px solid currentColor;
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  font-weight: 900;
}

.success-text {
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

.error-banner {
  color: var(--color-error);
  background: var(--color-error-light);
}

.problem-table {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: minmax(160px, 0.85fr) minmax(220px, 1.2fr) 100px 110px 86px 112px;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
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
  font-size: var(--font-sm);
}

.col-id,
.col-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-id {
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.col-title {
  font-weight: 800;
}

.col-limit,
.col-date {
  color: var(--color-text-secondary);
}

.col-action {
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border: 2px solid var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  font-weight: 900;
}

.status-badge.inactive {
  border-color: var(--color-text-muted);
  background: var(--color-border-light);
  color: var(--color-text-secondary);
}

.admin-state {
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

.page-button:disabled,
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 960px) {
  .admin-page {
    padding: var(--space-8) var(--space-4);
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-2);
  }

  .col-action {
    justify-content: flex-start;
  }
}
</style>
