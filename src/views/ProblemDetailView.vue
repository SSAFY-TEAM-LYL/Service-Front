<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchProblem } from '@/api/problems'

const route = useRoute()

const problem = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const problemId = computed(() => route.params.problemId)

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

const getErrorMessage = (error) => {
  if (error.response?.status === 404) {
    return '문제를 찾을 수 없습니다.'
  }
  if (error.response?.status === 503) {
    return '문제 저장소에 연결할 수 없습니다.'
  }
  return error.response?.data?.message || '문제를 불러오지 못했습니다.'
}

const loadProblem = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    problem.value = await fetchProblem(problemId.value)
  } catch (error) {
    problem.value = null
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(loadProblem)

watch(problemId, () => {
  loadProblem()
})
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

      <article v-else-if="problem" class="statement">
        <header class="statement-header">
          <div>
            <span class="problem-id">#{{ problem.id }}</span>
            <h1>{{ problem.title }}</h1>
          </div>
          <dl class="meta-list">
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
    </div>
  </div>
</template>

<style scoped>
.problem-detail {
  background: linear-gradient(90deg, var(--color-bg) 0%, var(--color-bg) 50%, var(--color-surface) 50%, var(--color-surface) 100%);
}

.detail-container {
  padding-top: var(--space-8);
  padding-bottom: var(--space-12);
  max-width: 1120px;
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

.statement {
  max-width: 760px;
  padding: var(--space-8);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}

.statement-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-6);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
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
  font-weight: 800;
  line-height: 1.25;
}

.meta-list {
  min-width: 120px;
}

.meta-list div {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border-light);
}

.statement-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.statement-section h2 {
  margin-bottom: var(--space-3);
  font-size: var(--font-lg);
  font-weight: 800;
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

.sample-block pre {
  min-height: 96px;
  overflow: auto;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #111827;
  color: #f9fafb;
  font-size: var(--font-sm);
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-state {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  max-width: 760px;
  padding: var(--space-16) var(--space-6);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

@media (max-width: 860px) {
  .problem-detail {
    background: var(--color-bg);
  }

  .detail-container {
    padding: var(--space-6) var(--space-4) var(--space-10);
  }

  .statement {
    padding: var(--space-5);
  }

  .statement-header {
    flex-direction: column;
  }

  .statement h1 {
    font-size: var(--font-2xl);
  }

  .sample-item {
    grid-template-columns: 1fr;
  }
}
</style>
