<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()

const post = ref(null)
const loading = ref(true)

// 임시 목 데이터 (추후 API 연동)
const mockPosts = {
  1: {
    id: 1,
    title: '이분 탐색 응용 문제에서 막혔습니다',
    author: '초보개발',
    date: '2026-05-16',
    views: 112,
    content: `안녕하세요, 이분 탐색 기본 문제는 풀겠는데 응용 문제에서 계속 막힙니다.\n\n특히 parametric search 유형이 어렵네요.\n매개변수를 어떻게 설정해야 할지 감이 안 옵니다.\n\n혹시 좋은 풀이 접근법이나 추천 문제가 있을까요?`,
  },
  2: {
    id: 2,
    title: 'BFS/DFS 문제 추천 부탁드립니다',
    author: '코린이',
    date: '2026-05-17',
    views: 67,
    content: `BFS와 DFS를 이제 막 배웠는데,\n연습할 수 있는 좋은 문제를 추천해주시면 감사하겠습니다.\n\n난이도는 실버 중~상 정도가 좋을 것 같아요!`,
  },
  3: {
    id: 3,
    title: '다익스트라 알고리즘 정리 노트',
    author: '알고장인',
    date: '2026-05-17',
    views: 89,
    content: `다익스트라 알고리즘을 공부하며 정리한 노트를 공유합니다.\n\n## 핵심 아이디어\n- 시작 노드에서 각 노드까지의 최단 거리를 구하는 알고리즘\n- 음의 가중치가 없는 그래프에서 사용 가능\n- 우선순위 큐(힙)를 사용하면 O(E log V)\n\n## 구현 팁\n1. dist 배열을 INF로 초기화\n2. 시작 노드의 dist를 0으로 설정\n3. 힙에서 꺼낸 거리가 현재 dist보다 크면 스킵`,
  },
  4: {
    id: 4,
    title: '백준 골드 달성 후기 및 공부 방법 공유',
    author: '성장일기',
    date: '2026-05-18',
    views: 156,
    content: `드디어 백준 골드를 달성했습니다!\n\n3개월간의 공부 과정을 공유합니다.\n\n**1개월차**: 실버 문제 위주로 하루 2문제씩\n**2개월차**: 골드 하위 문제 도전, 모르면 풀이 참고\n**3개월차**: 스스로 풀어보는 연습 + 코드 리뷰\n\n중요한 건 매일 꾸준히 하는 거였습니다.`,
  },
  5: {
    id: 5,
    title: '그리디 vs DP, 어떻게 구분하나요?',
    author: '궁금이',
    date: '2026-05-18',
    views: 203,
    content: `문제를 보면 그리디로 풀어야 할지, DP로 풀어야 할지 판단이 안 됩니다.\n\n그리디가 성립하는 조건이 뭔지,\nDP로 풀어야 하는 신호가 뭔지 알려주시면 감사하겠습니다.\n\n구체적인 예시도 있으면 좋겠어요!`,
  },
}

onMounted(() => {
  const id = route.params.id
  // 임시: mock data에서 조회
  setTimeout(() => {
    post.value = mockPosts[id] || null
    loading.value = false
  }, 200)
})
</script>

<template>
  <div class="container detail-page">
    <div v-if="loading" class="detail-loading">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="!post" class="detail-empty fade-in">
      <h2>게시글을 찾을 수 없습니다</h2>
      <p>삭제되었거나 존재하지 않는 게시글입니다.</p>
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
