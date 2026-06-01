<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { fetchBoardPost } from '@/api/board'

const route = useRoute()

const post = ref(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  const id = route.params.id
  try {
    post.value = await fetchBoardPost(id)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '게시글을 불러오지 못했습니다.'
    post.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container detail-page">
    <div v-if="loading" class="detail-loading">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="!post" class="detail-empty fade-in">
      <h2>게시글을 찾을 수 없습니다</h2>
      <p>{{ errorMessage || '삭제되었거나 존재하지 않는 게시글입니다.' }}</p>
      <RouterLink to="/board" class="btn btn-outline" style="margin-top: var(--space-4);">목록으로</RouterLink>
    </div>

    <article v-else class="detail-article fade-in">
      <RouterLink to="/board" class="back-link">← 목록으로</RouterLink>

      <header class="detail-header">
        <h1 class="detail-title">{{ post.title }}</h1>
        <div class="detail-meta">
          <span class="meta-author">{{ post.author }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-date">{{ post.date }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-views">조회 {{ post.views }}</span>
        </div>
      </header>

      <div class="detail-body">
        <p v-for="(line, i) in post.content.split('\n')" :key="i">
          <template v-if="line.trim()">{{ line }}</template>
          <br v-else />
        </p>
      </div>

      <footer class="detail-footer">
        <RouterLink to="/board" class="btn btn-outline">목록</RouterLink>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 720px;
  padding: var(--space-10) var(--space-6);
}

.detail-loading,
.detail-empty {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--color-text-muted);
}

.detail-empty h2 {
  margin-bottom: var(--space-2);
  color: var(--color-text);
}

.back-link {
  display: inline-block;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.detail-header {
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--space-8);
}

.detail-title {
  font-size: var(--font-2xl);
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: var(--space-3);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.meta-author {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.meta-sep {
  color: var(--color-border);
}

.detail-body {
  line-height: 1.9;
  font-size: var(--font-base);
  color: var(--color-text);
  min-height: 200px;
}

.detail-body p {
  margin-bottom: var(--space-1);
}

.detail-footer {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}
</style>
