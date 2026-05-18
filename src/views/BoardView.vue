<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const posts = ref([
  { id: 5, title: '그리디 vs DP, 어떻게 구분하나요?', author: '궁금이', date: '2026-05-18', comments: 12, views: 203 },
  { id: 4, title: '백준 골드 달성 후기 및 공부 방법 공유', author: '성장일기', date: '2026-05-18', comments: 8, views: 156 },
  { id: 3, title: '다익스트라 알고리즘 정리 노트', author: '알고장인', date: '2026-05-17', comments: 5, views: 89 },
  { id: 2, title: 'BFS/DFS 문제 추천 부탁드립니다', author: '코린이', date: '2026-05-17', comments: 3, views: 67 },
  { id: 1, title: '이분 탐색 응용 문제에서 막혔습니다', author: '초보개발', date: '2026-05-16', comments: 7, views: 112 },
])
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

    <div class="board-table">
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

    <div class="board-empty" v-if="posts.length === 0">
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

.board-empty p {
  margin-bottom: var(--space-4);
}

@media (max-width: 640px) {
  .col-author, .col-date, .col-views {
    display: none;
  }
}
</style>
