<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchBoardPosts } from '@/api/board'

const posts = ref([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    posts.value = await fetchBoardPosts()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container board-page fade-in">
    <div class="board-top">
      <div>
        <h1 class="board-title">커뮤니티</h1>
        <p class="board-desc">질문하고, 풀이를 공유하고, 함께 성장하세요.</p>
      </div>
      <RouterLink to="/board/write" class="btn btn-primary">
        ✏️ 글쓰기
      </RouterLink>
    </div>

    <div v-if="loading" class="board-state">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="board-state">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else class="board-table">
      <div class="table-header">
        <span class="col-id">#</span>
        <span class="col-title">제목</span>
        <span class="col-author">작성자</span>
        <span class="col-date">작성일</span>
        <span class="col-views">조회</span>
      </div>

      <RouterLink
        v-for="post in posts"
        :key="post.id"
        :to="`/board/${post.id}`"
        class="table-row"
      >
        <span class="col-id">{{ post.id }}</span>
        <span class="col-title">
          {{ post.title }}
          <span v-if="post.comments" class="comment-count">[{{ post.comments }}]</span>
        </span>
        <span class="col-author">{{ post.author }}</span>
        <span class="col-date">{{ post.date }}</span>
        <span class="col-views">{{ post.views }}</span>
      </RouterLink>
    </div>

    <div class="board-empty" v-if="!loading && !errorMessage && posts.length === 0">
      <p>아직 작성된 글이 없습니다.</p>
      <RouterLink to="/board/write" class="btn btn-outline">첫 글을 작성해보세요</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.board-page {
  padding: var(--space-10) var(--space-6);
  max-width: 860px;
}

.board-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-8);
}

.board-title {
  font-size: var(--font-2xl);
  font-weight: 800;
  margin-bottom: var(--space-1);
}

.board-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

/* ===== Table ===== */
.board-table {
  border-top: 2px solid var(--color-text);
}

.table-header {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.table-row {
  display: flex;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-fast);
  cursor: pointer;
}

.table-row:hover {
  background-color: var(--color-primary-light);
}

.col-id {
  width: 50px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  flex-shrink: 0;
}

.col-title {
  flex: 1;
  font-weight: 500;
  font-size: var(--font-sm);
  padding-right: var(--space-4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-count {
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 600;
  margin-left: var(--space-1);
}

.col-author {
  width: 100px;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.col-date {
  width: 100px;
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.col-views {
  width: 60px;
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.board-empty {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--color-text-muted);
}

.board-state {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--color-text-muted);
  border-top: 2px solid var(--color-text);
  border-bottom: 1px solid var(--color-border-light);
}

.board-empty p {
  margin-bottom: var(--space-4);
}

@media (max-width: 640px) {
  .col-author, .col-date, .col-views {
    display: none;
  }
}
</style>
