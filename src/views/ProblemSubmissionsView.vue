<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchProblem } from '@/api/problems'
import {
  createSubmission,
  createSubmissionReview,
  deleteSubmission,
  deleteSubmissionReview,
  fetchProblemSubmissions,
  fetchSubmission,
  fetchSubmissionReviews,
  updateSubmission,
  updateSubmissionReview,
} from '@/api/submissions'
import MonacoCodeEditor from '@/components/MonacoCodeEditor.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const problem = ref(null)
const loading = ref(true)
const listLoading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const submissions = ref([])
const nextCursor = ref(null)
const hasNext = ref(false)
const selectedSubmission = ref(null)
const selectedLanguage = ref('PYTHON3')
const sourceCode = ref('')

const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsNextCursor = ref(null)
const reviewsHasNext = ref(false)
const reviewContent = ref('')
const reviewSaving = ref(false)
const editingReviewId = ref(null)
const editingReviewContent = ref('')

const languageOptions = [
  { value: 'PYTHON3', label: 'Python 3' },
  { value: 'JAVA', label: 'Java' },
  { value: 'CPP', label: 'C++' },
]

const codeTemplates = {
  PYTHON3: 'a, b = map(int, input().split())\nprint(a + b)\n',
  JAVA: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringTokenizer st = new StringTokenizer(br.readLine());\n        int a = Integer.parseInt(st.nextToken());\n        int b = Integer.parseInt(st.nextToken());\n        System.out.println(a + b);\n    }\n}\n',
  CPP: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << '\\n';\n    return 0;\n}\n",
}

const problemId = computed(() => route.params.problemId)
const isEditingSubmission = computed(() => Boolean(selectedSubmission.value))
const canSave = computed(() => sourceCode.value.trim() && !saving.value)

const statusLabel = (status) => {
  const labels = {
    PENDING: '대기 중',
    JUDGING: '채점 중',
    ACCEPTED: '정답',
    WRONG_ANSWER: '오답',
    COMPILE_ERROR: '컴파일 에러',
    RUNTIME_ERROR: '런타임 에러',
    TIME_LIMIT_EXCEEDED: '시간 초과',
    INTERNAL_ERROR: '채점 오류',
  }
  return labels[status] || '-'
}

const statusClass = (status) => {
  if (status === 'ACCEPTED') return 'status-accepted'
  if (status === 'PENDING' || status === 'JUDGING') return 'status-running'
  if (!status) return ''
  return 'status-failed'
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatUsage = (submission) => {
  if (!submission) return '-'
  const time =
    submission.maxTimeMs === null || submission.maxTimeMs === undefined
      ? '-'
      : `${submission.maxTimeMs}ms`
  const memory =
    submission.maxMemoryKb === null || submission.maxMemoryKb === undefined
      ? '-'
      : `${submission.maxMemoryKb}KB`
  return `${time} / ${memory}`
}

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 401) {
    return '로그인 후 이용할 수 있습니다.'
  }
  if (error.response?.status === 404) {
    return '요청한 데이터를 찾을 수 없습니다.'
  }
  if (error.response?.status === 503) {
    return '채점 서버 또는 문제 저장소에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || fallback
}

const resetEditorTemplate = () => {
  sourceCode.value = codeTemplates[selectedLanguage.value]
}

const startNewSubmission = () => {
  selectedSubmission.value = null
  selectedLanguage.value = 'PYTHON3'
  resetEditorTemplate()
  reviews.value = []
  reviewsNextCursor.value = null
  reviewsHasNext.value = false
  reviewContent.value = ''
  editingReviewId.value = null
  editingReviewContent.value = ''
  actionMessage.value = ''
}

const selectSubmission = async (submission) => {
  actionMessage.value = ''
  selectedSubmission.value = submission
  selectedLanguage.value = submission.language
  sourceCode.value = submission.sourceCode || ''
  reviewContent.value = ''
  editingReviewId.value = null
  editingReviewContent.value = ''
  await loadReviews(true)
}

const loadProblem = async () => {
  problem.value = await fetchProblem(problemId.value)
}

const loadSubmissions = async ({ append = false } = {}) => {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  listLoading.value = true
  try {
    const data = await fetchProblemSubmissions(problemId.value, {
      cursor: append ? nextCursor.value : null,
      size: 10,
    })
    submissions.value = append ? [...submissions.value, ...(data.items || [])] : data.items || []
    nextCursor.value = data.nextCursor
    hasNext.value = data.hasNext
    if (!append && submissions.value.length > 0) {
      await selectSubmission(submissions.value[0])
    } else if (!append) {
      startNewSubmission()
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '제출 목록을 불러오지 못했습니다.')
  } finally {
    listLoading.value = false
  }
}

const loadInitial = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadProblem()
    await loadSubmissions()
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '화면을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const saveSubmission = async () => {
  if (!sourceCode.value.trim()) {
    actionMessage.value = '제출할 코드를 입력해주세요.'
    return
  }

  saving.value = true
  actionMessage.value = ''
  const wasEditing = Boolean(selectedSubmission.value)
  try {
    const payload = {
      language: selectedLanguage.value,
      sourceCode: sourceCode.value,
    }
    const saved = selectedSubmission.value
      ? await updateSubmission(selectedSubmission.value.id, payload)
      : await createSubmission(problemId.value, payload)

    const existingIndex = submissions.value.findIndex((item) => item.id === saved.id)
    if (existingIndex >= 0) {
      submissions.value.splice(existingIndex, 1, saved)
    } else {
      submissions.value = [saved, ...submissions.value]
    }
    await selectSubmission(saved)
    actionMessage.value = wasEditing
      ? '제출 코드를 수정하고 재채점을 시작했습니다.'
      : '코드를 제출했습니다.'
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '제출 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

const refreshSelectedSubmission = async () => {
  if (!selectedSubmission.value) return
  actionMessage.value = ''
  try {
    const refreshed = await fetchSubmission(selectedSubmission.value.id)
    const index = submissions.value.findIndex((item) => item.id === refreshed.id)
    if (index >= 0) submissions.value.splice(index, 1, refreshed)
    selectedSubmission.value = refreshed
    selectedLanguage.value = refreshed.language
    sourceCode.value = refreshed.sourceCode || ''
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '제출을 새로고침하지 못했습니다.')
  }
}

const removeSubmission = async () => {
  if (!selectedSubmission.value) return
  const ok = window.confirm('선택한 제출 코드를 삭제할까요?')
  if (!ok) return

  deleting.value = true
  actionMessage.value = ''
  try {
    const deletedId = selectedSubmission.value.id
    await deleteSubmission(deletedId)
    submissions.value = submissions.value.filter((item) => item.id !== deletedId)
    if (submissions.value.length > 0) {
      await selectSubmission(submissions.value[0])
    } else {
      startNewSubmission()
    }
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '제출 삭제에 실패했습니다.')
  } finally {
    deleting.value = false
  }
}

const loadReviews = async (reset = false) => {
  if (!selectedSubmission.value) return
  reviewsLoading.value = true
  if (reset) {
    reviews.value = []
    reviewsNextCursor.value = null
    reviewsHasNext.value = false
  }
  try {
    const data = await fetchSubmissionReviews(selectedSubmission.value.id, {
      cursor: reset ? null : reviewsNextCursor.value,
      size: 20,
    })
    reviews.value = reset ? data.items || [] : [...reviews.value, ...(data.items || [])]
    reviewsNextCursor.value = data.nextCursor
    reviewsHasNext.value = data.hasNext
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '리뷰를 불러오지 못했습니다.')
  } finally {
    reviewsLoading.value = false
  }
}

const saveReview = async () => {
  if (!selectedSubmission.value || !reviewContent.value.trim()) return
  reviewSaving.value = true
  actionMessage.value = ''
  try {
    const review = await createSubmissionReview(selectedSubmission.value.id, {
      content: reviewContent.value,
    })
    reviews.value = [...reviews.value, review]
    reviewContent.value = ''
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '리뷰 작성에 실패했습니다.')
  } finally {
    reviewSaving.value = false
  }
}

const startEditReview = (review) => {
  editingReviewId.value = review.id
  editingReviewContent.value = review.content
}

const cancelEditReview = () => {
  editingReviewId.value = null
  editingReviewContent.value = ''
}

const saveEditedReview = async (reviewId) => {
  if (!editingReviewContent.value.trim()) return
  actionMessage.value = ''
  try {
    const updated = await updateSubmissionReview(reviewId, { content: editingReviewContent.value })
    reviews.value = reviews.value.map((review) => (review.id === updated.id ? updated : review))
    cancelEditReview()
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '리뷰 수정에 실패했습니다.')
  }
}

const removeReview = async (reviewId) => {
  const ok = window.confirm('리뷰를 삭제할까요?')
  if (!ok) return
  actionMessage.value = ''
  try {
    await deleteSubmissionReview(reviewId)
    reviews.value = reviews.value.filter((review) => review.id !== reviewId)
  } catch (error) {
    actionMessage.value = getErrorMessage(error, '리뷰 삭제에 실패했습니다.')
  }
}

onMounted(loadInitial)

watch(selectedLanguage, (language, oldLanguage) => {
  if (!selectedSubmission.value && language !== oldLanguage) {
    resetEditorTemplate()
  }
})
</script>

<template>
  <div class="submissions-view fade-in">
    <div class="container submissions-container">
      <div class="submissions-topbar">
        <div>
          <RouterLink :to="{ name: 'problem-detail', params: { problemId } }" class="back-link">
            ← 문제로 돌아가기
          </RouterLink>
          <h1>{{ problem?.title || '제출 코드' }}</h1>
        </div>
        <button type="button" class="btn btn-primary" @click="startNewSubmission">새 제출</button>
      </div>

      <div v-if="loading" class="page-state">불러오는 중...</div>

      <div v-else-if="errorMessage" class="page-state">
        <p>{{ errorMessage }}</p>
        <button type="button" class="btn btn-outline" @click="loadInitial">다시 시도</button>
      </div>

      <div v-else class="submissions-layout">
        <aside class="submission-list-panel">
          <header class="panel-header">
            <h2>제출 목록</h2>
            <button type="button" class="btn btn-ghost btn-sm" @click="loadSubmissions()">
              새로고침
            </button>
          </header>

          <p v-if="listLoading && submissions.length === 0" class="muted">불러오는 중...</p>
          <ul v-else-if="submissions.length > 0" class="submission-list">
            <li v-for="submission in submissions" :key="submission.id">
              <button
                type="button"
                class="submission-item"
                :class="{ active: selectedSubmission?.id === submission.id }"
                @click="selectSubmission(submission)"
              >
                <span class="status-badge" :class="statusClass(submission.status)">
                  {{ statusLabel(submission.status) }}
                </span>
                <strong>{{ submission.language }}</strong>
                <span>{{ submission.passedTestCount }} / {{ submission.totalTestCount }}</span>
                <span>{{ formatDate(submission.submittedAt) }}</span>
              </button>
            </li>
          </ul>
          <p v-else class="muted">아직 제출한 코드가 없습니다.</p>

          <button
            v-if="hasNext"
            type="button"
            class="btn btn-outline btn-block"
            @click="loadSubmissions({ append: true })"
          >
            더 보기
          </button>
        </aside>

        <main class="submission-workspace">
          <section class="editor-section">
            <header class="workspace-header">
              <div>
                <span class="section-eyebrow">{{
                  isEditingSubmission ? `#${selectedSubmission.id}` : 'NEW'
                }}</span>
                <h2>{{ isEditingSubmission ? '제출 코드 수정' : '새 코드 제출' }}</h2>
              </div>
              <div class="workspace-actions">
                <button
                  v-if="selectedSubmission"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="refreshSelectedSubmission"
                >
                  결과 새로고침
                </button>
                <button
                  v-if="selectedSubmission"
                  type="button"
                  class="btn btn-outline btn-sm danger"
                  :disabled="deleting"
                  @click="removeSubmission"
                >
                  삭제
                </button>
              </div>
            </header>

            <div class="language-tabs" role="tablist" aria-label="언어 선택">
              <button
                v-for="language in languageOptions"
                :key="language.value"
                type="button"
                class="language-tab"
                :class="{ active: selectedLanguage === language.value }"
                @click="selectedLanguage = language.value"
              >
                {{ language.label }}
              </button>
            </div>

            <MonacoCodeEditor v-model="sourceCode" :language="selectedLanguage" />

            <div v-if="selectedSubmission" class="result-summary">
              <span class="status-badge" :class="statusClass(selectedSubmission.status)">
                {{ statusLabel(selectedSubmission.status) }}
              </span>
              <span
                >통과 {{ selectedSubmission.passedTestCount }} /
                {{ selectedSubmission.totalTestCount }}</span
              >
              <span>{{ formatUsage(selectedSubmission) }}</span>
              <span>{{ formatDate(selectedSubmission.submittedAt) }}</span>
            </div>

            <pre v-if="selectedSubmission?.errorMessage" class="judge-message">{{
              selectedSubmission.errorMessage
            }}</pre>

            <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>

            <div class="save-row">
              <button
                type="button"
                class="btn btn-primary btn-lg"
                :disabled="!canSave"
                @click="saveSubmission"
              >
                {{ saving ? '저장 중...' : isEditingSubmission ? '수정 후 재채점' : '제출하기' }}
              </button>
            </div>
          </section>

          <section class="review-section" :class="{ disabled: !selectedSubmission }">
            <header class="panel-header">
              <h2>코드 리뷰</h2>
              <button
                v-if="selectedSubmission"
                type="button"
                class="btn btn-ghost btn-sm"
                @click="loadReviews(true)"
              >
                새로고침
              </button>
            </header>

            <p v-if="!selectedSubmission" class="muted">
              제출 코드를 선택하면 리뷰를 작성할 수 있습니다.
            </p>

            <template v-else>
              <form class="review-form" @submit.prevent="saveReview">
                <textarea
                  v-model="reviewContent"
                  rows="4"
                  placeholder="리뷰를 작성하세요"
                ></textarea>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="!reviewContent.trim() || reviewSaving"
                >
                  {{ reviewSaving ? '작성 중...' : '리뷰 작성' }}
                </button>
              </form>

              <p v-if="reviewsLoading && reviews.length === 0" class="muted">
                리뷰를 불러오는 중...
              </p>
              <ul v-else-if="reviews.length > 0" class="review-list">
                <li v-for="review in reviews" :key="review.id" class="review-item">
                  <div class="review-meta">
                    <strong>{{ review.author }}</strong>
                    <span>{{ formatDate(review.createdAt) }}</span>
                  </div>

                  <template v-if="editingReviewId === review.id">
                    <textarea v-model="editingReviewContent" rows="4"></textarea>
                    <div class="review-actions">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        @click="saveEditedReview(review.id)"
                      >
                        저장
                      </button>
                      <button type="button" class="btn btn-ghost btn-sm" @click="cancelEditReview">
                        취소
                      </button>
                    </div>
                  </template>

                  <template v-else>
                    <p>{{ review.content }}</p>
                    <div class="review-actions">
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        @click="startEditReview(review)"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm danger-text"
                        @click="removeReview(review.id)"
                      >
                        삭제
                      </button>
                    </div>
                  </template>
                </li>
              </ul>
              <p v-else class="muted">아직 리뷰가 없습니다.</p>

              <button
                v-if="reviewsHasNext"
                type="button"
                class="btn btn-outline btn-block"
                @click="loadReviews()"
              >
                리뷰 더 보기
              </button>
            </template>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submissions-view {
  min-height: 100%;
  background: transparent;
}

.submissions-container {
  max-width: none;
  padding: 0;
}

.submissions-topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.back-link {
  display: inline-flex;
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 700;
}

.submissions-topbar h1 {
  font-size: var(--font-3xl);
  font-family: var(--font-mono);
  font-weight: 900;
}

.page-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-6);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  color: var(--color-text-secondary);
}

.submissions-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.submission-list-panel,
.editor-section,
.review-section {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.submission-list-panel {
  position: sticky;
  top: var(--space-6);
}

.submission-workspace {
  display: grid;
  gap: var(--space-5);
  min-width: 0;
}

.panel-header,
.workspace-header,
.workspace-actions,
.save-row,
.review-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.panel-header h2,
.workspace-header h2 {
  font-size: var(--font-lg);
  font-family: var(--font-mono);
  font-weight: 950;
}

.section-eyebrow {
  color: var(--color-primary-dark);
  font-size: var(--font-xs);
  font-weight: 900;
}

.submission-list,
.review-list {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

.submission-item {
  display: grid;
  width: 100%;
  grid-template-columns: 84px 64px 56px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 3px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  text-align: left;
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  font-weight: 850;
}

.submission-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-text);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 900;
}

.status-accepted {
  background: #dcfce7;
  color: #15803d;
}

.status-running {
  background: #fef3c7;
  color: #b45309;
}

.status-failed {
  background: #fee2e2;
  color: #b91c1c;
}

.language-tabs {
  display: inline-flex;
  width: fit-content;
  overflow: hidden;
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.language-tab {
  min-width: 88px;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  font-weight: 900;
}

.language-tab + .language-tab {
  border-left: 3px solid var(--color-border);
}

.language-tab.active {
  background: var(--color-primary);
  color: #fff;
}

.result-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 800;
}

.judge-message {
  overflow: auto;
  padding: var(--space-4);
  border: 3px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #111827;
  color: #f9fafb;
  font-size: var(--font-sm);
  line-height: 1.6;
  white-space: pre-wrap;
}

.action-message {
  padding: var(--space-3) var(--space-4);
  border: 3px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  font-weight: 850;
}

.review-section.disabled {
  opacity: 0.72;
}

.review-form {
  display: grid;
  gap: var(--space-3);
}

.review-form textarea,
.review-item textarea {
  width: 100%;
  resize: vertical;
  padding: var(--space-3);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  outline: none;
  font: inherit;
  line-height: 1.6;
}

.review-form textarea:focus,
.review-item textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 4px 4px 0 var(--color-border-light);
}

.review-item {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 3px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.review-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.review-item p {
  white-space: pre-wrap;
}

.muted {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.btn-block {
  width: 100%;
}

.danger {
  border-color: #fecaca;
  color: #b91c1c;
}

.danger-text {
  color: #b91c1c;
}

@media (max-width: 1120px) {
  .submissions-layout {
    grid-template-columns: 1fr;
  }

  .submission-list-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .submissions-container {
    padding: var(--space-6) var(--space-4) var(--space-10);
  }

  .submissions-topbar,
  .workspace-header,
  .workspace-actions,
  .panel-header,
  .save-row {
    align-items: stretch;
    flex-direction: column;
  }

  .submission-item {
    grid-template-columns: 84px 1fr;
  }

  .language-tabs {
    width: 100%;
  }

  .language-tab {
    flex: 1;
    min-width: 0;
  }
}
</style>
