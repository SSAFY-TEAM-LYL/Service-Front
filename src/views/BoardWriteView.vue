<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createBoardPost } from '@/api/board'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const allCategories = [
  { value: 'NOTICE', label: '공지' },
  { value: 'FREE', label: '자유' },
  { value: 'QUESTION', label: '질문' },
]

const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const selectableCategories = computed(() => {
  return isAdmin.value ? allCategories : allCategories.filter((item) => item.value !== 'NOTICE')
})

const initialCategory = allCategories.some((item) => item.value === route.query.category)
  ? route.query.category
  : 'FREE'

const category = ref(initialCategory)
const title = ref('')
const content = ref('')
const errors = ref({})
const loading = ref(false)

watchEffect(() => {
  if (!selectableCategories.value.some((item) => item.value === category.value)) {
    category.value = 'FREE'
  }
})

const validate = () => {
  const e = {}
  if (!selectableCategories.value.some((item) => item.value === category.value)) {
    e.category = '선택할 수 없는 게시판입니다.'
  }
  if (!title.value.trim()) e.title = '제목을 입력해주세요.'
  if (!content.value.trim()) e.content = '내용을 입력해주세요.'
  errors.value = e
  return Object.keys(e).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const post = await createBoardPost({
      category: category.value,
      title: title.value.trim(),
      content: content.value.trim(),
    })
    router.push(`/board/${post.id}`)
  } catch (e) {
    errors.value.general = e.response?.data?.message || '글 작성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  if (title.value || content.value) {
    if (!confirm('작성 중인 내용이 사라집니다. 정말 나가시겠습니까?')) return
  }
  router.push('/board')
}
</script>

<template>
  <div class="container write-page fade-in">
    <div class="write-header">
      <h1 class="write-title">새 글 작성</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="write-form">
      <div class="input-group">
        <label>게시판</label>
        <div class="category-options">
          <button
            v-for="item in selectableCategories"
            :key="item.value"
            type="button"
            class="category-option"
            :class="{ active: category === item.value, notice: item.value === 'NOTICE' }"
            @click="category = item.value"
          >
            {{ item.label }}
          </button>
        </div>
        <p v-if="errors.category" class="error-text">{{ errors.category }}</p>
      </div>

      <div class="input-group">
        <label for="post-title">제목</label>
        <input
          type="text"
          id="post-title"
          v-model="title"
          placeholder="제목을 입력하세요"
          :class="{ 'input-error': errors.title }"
        />
        <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
      </div>

      <div class="input-group">
        <label for="post-content">내용</label>
        <textarea
          id="post-content"
          v-model="content"
          placeholder="내용을 입력하세요"
          rows="14"
          :class="{ 'input-error': errors.content }"
        ></textarea>
        <p v-if="errors.content" class="error-text">{{ errors.content }}</p>
      </div>

      <p v-if="errors.general" class="error-text" style="text-align:center; margin-bottom: var(--space-4);">{{ errors.general }}</p>

      <div class="write-actions">
        <button type="button" class="btn btn-outline" @click="handleCancel">취소</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '등록 중...' : '등록하기' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.write-page {
  max-width: 720px;
  padding: 0;
}

.write-header {
  margin-bottom: var(--space-8);
}

.write-title {
  font-size: var(--font-2xl);
  font-family: var(--font-mono);
  font-weight: 950;
}

.write-form {
  padding: var(--space-6);
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.write-form textarea {
  min-height: 320px;
  line-height: 1.8;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.category-option {
  min-width: 78px;
  padding: var(--space-2) var(--space-4);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  font-weight: 900;
  transition: all var(--transition-fast);
}

.category-option:hover,
.category-option.active {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

.category-option.notice.active {
  border-color: #f87171;
  color: #b91c1c;
  background: #fef2f2;
}

.write-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
