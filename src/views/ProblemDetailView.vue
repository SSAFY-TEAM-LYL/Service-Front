<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchProblem } from '@/api/problems'
import { createSubmission, fetchProblemSubmissions, fetchSubmission } from '@/api/submissions'
import MonacoCodeEditor from '@/components/MonacoCodeEditor.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const problem = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const selectedLanguage = ref('PYTHON3')
const sourceCode = ref('')
const submitting = ref(false)
const submissionError = ref('')
const latestSubmission = ref(null)
const recentSubmissions = ref([])
const recentLoading = ref(false)
let pollingTimer = null

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
const canSubmit = computed(() => sourceCode.value.trim() && !submitting.value)

const samples = computed(() => {
  return Array.isArray(problem.value?.samples) ? problem.value.samples : []
})

const constraints = computed(() => {
  const value = problem.value?.constraints
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(formatConstraint).filter(Boolean)
  }
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
})

const latestStatusClass = computed(() => statusClass(latestSubmission.value?.status))

const formatConstraint = (constraint) => {
  if (!constraint) return ''
  if (typeof constraint === 'string') return constraint
  const range = [constraint.minValue, constraint.maxValue]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .join(' ~ ')
  return [constraint.name, range, constraint.description].filter(Boolean).join(': ')
}

const sampleInput = (sample) => {
  return sample?.input ?? sample?.inputText ?? ''
}

const sampleOutput = (sample) => {
  return sample?.output ?? sample?.expectedOutput ?? ''
}

const formatTimeLimit = (value) => {
  if (!value) return '-'
  return `${value}ms`
}

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

const isInProgress = (status) => status === 'PENDING' || status === 'JUDGING'

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

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getProblemErrorMessage = (error) => {
  if (error.response?.status === 404) {
    return '문제를 찾을 수 없습니다.'
  }
  if (error.response?.status === 503) {
    return '문제 저장소에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || '문제를 불러오지 못했습니다.'
}

const getSubmissionErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return '로그인 후 제출할 수 있습니다.'
  }
  if (error.response?.status === 503) {
    return '채점 서버에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || '제출에 실패했습니다.'
}

const loadProblem = async () => {
  loading.value = true
  errorMessage.value = ''
  stopPolling()
  try {
    problem.value = await fetchProblem(problemId.value)
    await loadRecentSubmissions()
  } catch (error) {
    problem.value = null
    errorMessage.value = getProblemErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const loadRecentSubmissions = async () => {
  if (!auth.isLoggedIn) {
    recentSubmissions.value = []
    return
  }
  recentLoading.value = true
  try {
    const data = await fetchProblemSubmissions(problemId.value, { size: 5 })
    recentSubmissions.value = data.items || []
    latestSubmission.value = recentSubmissions.value[0] || latestSubmission.value
    if (latestSubmission.value && isInProgress(latestSubmission.value.status)) {
      startPolling(latestSubmission.value.id)
    }
  } catch {
    recentSubmissions.value = []
  } finally {
    recentLoading.value = false
  }
}

const resetTemplate = () => {
  sourceCode.value = codeTemplates[selectedLanguage.value]
}

const submitCode = async () => {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!sourceCode.value.trim()) {
    submissionError.value = '제출할 코드를 입력해주세요.'
    return
  }

  submitting.value = true
  submissionError.value = ''
  stopPolling()
  try {
    const submission = await createSubmission(problemId.value, {
      language: selectedLanguage.value,
      sourceCode: sourceCode.value,
    })
    latestSubmission.value = submission
    recentSubmissions.value = [
      submission,
      ...recentSubmissions.value.filter((item) => item.id !== submission.id),
    ].slice(0, 5)
    if (isInProgress(submission.status)) {
      startPolling(submission.id)
    }
  } catch (error) {
    submissionError.value = getSubmissionErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

const startPolling = (submissionId) => {
  stopPolling()
  pollingTimer = window.setInterval(async () => {
    try {
      const submission = await fetchSubmission(submissionId)
      latestSubmission.value = submission
      recentSubmissions.value = recentSubmissions.value.map((item) =>
        item.id === submission.id ? submission : item,
      )
      if (!isInProgress(submission.status)) {
        stopPolling()
        await loadRecentSubmissions()
      }
    } catch (error) {
      submissionError.value = getSubmissionErrorMessage(error)
      stopPolling()
    }
  }, 1500)
}

const stopPolling = () => {
  if (pollingTimer) {
    window.clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onMounted(async () => {
  resetTemplate()
  await loadProblem()
})

onBeforeUnmount(() => {
  stopPolling()
})

watch(problemId, () => {
  loadProblem()
})

watch(selectedLanguage, () => {
  resetTemplate()
})

watch(
  () => auth.isLoggedIn,
  () => {
    loadRecentSubmissions()
  },
)
</script>

<template>
  <div class="problem-detail fade-in">
    <div class="container detail-container">
      <RouterLink to="/problems" class="back-link">← 문제 목록</RouterLink>

      <div v-if="loading" class="detail-state">
        <p>불러오는 중...</p>
      </div>

      <div v-else-if="errorMessage" class="detail-state">
        <p>{{ errorMessage }}</p>
        <button type="button" class="btn btn-outline" @click="loadProblem">다시 시도</button>
      </div>

      <div v-else-if="problem" class="solve-layout">
        <article class="statement">
          <header class="statement-header">
            <div>
              <span class="problem-id">#{{ problem.problemNumber || problem.id }}</span>
              <h1>{{ problem.title }}</h1>
            </div>
            <dl class="meta-list">
              <div>
                <dt>난이도</dt>
                <dd>{{ problem.difficulty || '-' }}</dd>
              </div>
              <div>
                <dt>시간 제한</dt>
                <dd>{{ formatTimeLimit(problem.timeLimitMs) }}</dd>
              </div>
            </dl>
          </header>

          <section class="statement-section">
            <h2>문제 설명</h2>
            <p class="pre-line">{{ problem.description }}</p>
          </section>

          <section class="statement-section">
            <h2>입력</h2>
            <p class="pre-line">{{ problem.inputFormat || '-' }}</p>
          </section>

          <section class="statement-section">
            <h2>출력</h2>
            <p class="pre-line">{{ problem.outputFormat || '-' }}</p>
          </section>

          <section class="statement-section">
            <h2>제약</h2>
            <ul v-if="constraints.length > 0" class="constraint-list">
              <li v-for="constraint in constraints" :key="constraint">{{ constraint }}</li>
            </ul>
            <p v-else class="muted">-</p>
          </section>

          <section class="statement-section">
            <h2>예시</h2>
            <div v-if="samples.length > 0" class="sample-list">
              <div v-for="(sample, index) in samples" :key="index" class="sample-item">
                <div class="sample-block">
                  <h3>입력 {{ index + 1 }}</h3>
                  <pre>{{ sampleInput(sample) }}</pre>
                </div>
                <div class="sample-block">
                  <h3>출력 {{ index + 1 }}</h3>
                  <pre>{{ sampleOutput(sample) }}</pre>
                </div>
              </div>
            </div>
            <p v-else class="muted">-</p>
          </section>
        </article>

        <aside class="editor-panel">
          <div class="editor-toolbar">
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
            <div class="editor-tools">
              <RouterLink
                v-if="auth.isLoggedIn"
                :to="{ name: 'problem-submissions', params: { problemId } }"
                class="btn btn-outline btn-sm"
              >
                제출 목록
              </RouterLink>
              <button type="button" class="btn btn-ghost btn-sm" @click="resetTemplate">
                초기화
              </button>
            </div>
          </div>

          <MonacoCodeEditor v-model="sourceCode" :language="selectedLanguage" />

          <div v-if="submissionError" class="submit-message error-message">
            {{ submissionError }}
          </div>

          <div class="submit-actions">
            <p v-if="!auth.isLoggedIn" class="muted">로그인 후 제출할 수 있습니다.</p>
            <button
              type="button"
              class="btn btn-primary btn-lg"
              :disabled="!canSubmit"
              @click="submitCode"
            >
              {{ submitting ? '제출 중...' : auth.isLoggedIn ? '제출하기' : '로그인하고 제출' }}
            </button>
          </div>

          <section class="result-panel">
            <header class="result-header">
              <h2>채점 결과</h2>
              <span v-if="latestSubmission" class="status-badge" :class="latestStatusClass">
                {{ statusLabel(latestSubmission.status) }}
              </span>
            </header>

            <div v-if="latestSubmission" class="result-body">
              <dl class="result-grid">
                <div>
                  <dt>통과</dt>
                  <dd>
                    {{ latestSubmission.passedTestCount }} / {{ latestSubmission.totalTestCount }}
                  </dd>
                </div>
                <div>
                  <dt>시간 / 메모리</dt>
                  <dd>{{ formatUsage(latestSubmission) }}</dd>
                </div>
                <div>
                  <dt>언어</dt>
                  <dd>{{ latestSubmission.language }}</dd>
                </div>
                <div>
                  <dt>제출</dt>
                  <dd>{{ formatDate(latestSubmission.submittedAt) }}</dd>
                </div>
              </dl>
              <pre v-if="latestSubmission.errorMessage" class="judge-message">{{
                latestSubmission.errorMessage
              }}</pre>
            </div>

            <p v-else class="muted">아직 제출한 코드가 없습니다.</p>
          </section>

          <section class="recent-panel">
            <header class="result-header">
              <h2>최근 제출</h2>
              <button
                v-if="auth.isLoggedIn"
                type="button"
                class="btn btn-ghost btn-sm"
                @click="loadRecentSubmissions"
              >
                새로고침
              </button>
            </header>
            <p v-if="recentLoading" class="muted">불러오는 중...</p>
            <ul v-else-if="recentSubmissions.length > 0" class="recent-list">
              <li v-for="submission in recentSubmissions" :key="submission.id">
                <span class="status-badge" :class="statusClass(submission.status)">
                  {{ statusLabel(submission.status) }}
                </span>
                <span>{{ submission.language }}</span>
                <span>{{ submission.passedTestCount }} / {{ submission.totalTestCount }}</span>
                <span>{{ formatDate(submission.submittedAt) }}</span>
              </li>
            </ul>
            <p v-else class="muted">최근 제출이 없습니다.</p>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-detail {
  min-height: 100%;
  background: transparent;
}

.detail-container {
  padding: 0;
  max-width: 1440px;
}

.back-link {
  display: inline-flex;
  margin-bottom: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 700;
}

.back-link:hover {
  color: var(--color-primary-dark);
}

.solve-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(440px, 0.82fr);
  gap: var(--space-6);
  align-items: start;
}

.statement {
  min-width: 0;
  padding: var(--space-6);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.statement-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-6);
  padding-bottom: var(--space-6);
  border-bottom: 3px solid var(--color-border);
}

.problem-id {
  display: inline-flex;
  margin-bottom: var(--space-2);
  color: var(--color-primary-dark);
  font-size: var(--font-sm);
  font-weight: 800;
}

.statement h1 {
  font-size: var(--font-3xl);
  font-family: var(--font-mono);
  font-weight: 950;
  line-height: 1.25;
}

.meta-list {
  min-width: 120px;
}

.meta-list div {
  padding: var(--space-3);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.meta-list dt {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 800;
}

.meta-list dd {
  margin-top: var(--space-1);
  color: var(--color-text);
  font-weight: 800;
}

.statement-section {
  padding: var(--space-7) 0;
  border-bottom: 2px solid var(--color-border-light);
}

.statement-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.statement-section h2 {
  margin-bottom: var(--space-3);
  font-size: var(--font-lg);
  font-family: var(--font-mono);
  font-weight: 950;
}

.pre-line {
  white-space: pre-wrap;
  color: var(--color-text);
}

.constraint-list {
  display: grid;
  gap: var(--space-2);
  padding-left: var(--space-5);
}

.muted {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.sample-list {
  display: grid;
  gap: var(--space-5);
}

.sample-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
}

.sample-block {
  min-width: 0;
}

.sample-block h3 {
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 800;
}

.sample-block pre,
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

.sample-block pre {
  min-height: 96px;
}

.detail-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  max-width: 760px;
  padding: var(--space-16) var(--space-6);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  color: var(--color-text-secondary);
}

.editor-panel {
  position: sticky;
  top: var(--space-6);
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.editor-toolbar,
.submit-actions,
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.editor-tools {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.language-tabs {
  display: inline-flex;
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

.submit-actions {
  padding: var(--space-4);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-xs);
}

.submit-actions .btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.submit-message {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: 700;
}

.error-message {
  border: 3px solid #fecaca;
  background: var(--color-error-light);
  color: var(--color-error);
}

.result-panel,
.recent-panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.result-header h2 {
  font-size: var(--font-lg);
  font-family: var(--font-mono);
  font-weight: 950;
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

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.result-grid div {
  padding: var(--space-3);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.result-grid dt {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 800;
}

.result-grid dd {
  margin-top: var(--space-1);
  font-size: var(--font-sm);
  font-weight: 900;
}

.recent-list {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

.recent-list li {
  display: grid;
  grid-template-columns: 84px 64px 72px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 2px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 700;
}

.recent-list li:last-child {
  border-bottom: 0;
}

@media (max-width: 1080px) {
  .problem-detail {
    background: var(--color-bg);
  }

  .solve-layout {
    grid-template-columns: 1fr;
  }

  .editor-panel {
    position: static;
  }
}

@media (max-width: 860px) {
  .detail-container {
    padding: var(--space-6) var(--space-4) var(--space-10);
  }

  .statement {
    padding: var(--space-5);
  }

  .statement-header,
  .submit-actions,
  .result-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .statement h1 {
    font-size: var(--font-2xl);
  }

  .sample-item,
  .result-grid {
    grid-template-columns: 1fr;
  }

  .language-tabs {
    width: 100%;
  }

  .language-tab {
    flex: 1;
    min-width: 0;
  }

  .editor-toolbar,
  .editor-tools {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }
}
</style>
