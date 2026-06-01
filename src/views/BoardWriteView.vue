<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createBoardPost } from '@/api/board'

const router = useRouter()

const title = ref('')
const content = ref('')
const errors = ref({})
const loading = ref(false)

const validate = () => {
  const e = {}
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
  padding: var(--space-10) var(--space-6);
}

.write-header {
  margin-bottom: var(--space-8);
}

.write-title {
  font-size: var(--font-2xl);
  font-weight: 800;
}

.write-form textarea {
  min-height: 320px;
  line-height: 1.8;
}

.write-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
