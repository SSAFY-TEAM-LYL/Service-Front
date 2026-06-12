<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchBoardPosts } from '@/api/board'

const route = useRoute()
const router = useRouter()

const categories = [
  { value: '', label: '전체' },
  { value: 'NOTICE', label: '공지' },
  { value: 'FREE', label: '자유' },
  { value: 'QUESTION', label: '질문' },
]

const PAGE_SIZE = 10

const posts = ref([])
const loading = ref(true)
const errorMessage = ref('')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageCursors = ref([null])

const selectedCategory = computed(() => {
  const category = route.query.category
  return categories.some((item) => item.value === category) ? category : ''
})

const selectedCategoryLabel = computed(() => {
  return categories.find((item) => item.value === selectedCategory.value)?.label || '전체'
})

const writeTo = computed(() => ({
  name: 'board-write',
  query: selectedCategory.value ? { category: selectedCategory.value } : {},
}))

const pageNumbers = computed(() => {
  const pageCount = currentPage.value + (hasNextPage.value ? 1 : 0)
  return Array.from({ length: pageCount }, (_, index) => index + 1)
})

const categoryLabel = (category) => {
  return categories.find((item) => item.value === category)?.label || category
}

const changeCategory = (category) => {
  router.push({
    name: 'board',
    query: category ? { category } : {},
  })
}

const resetPagination = () => {
  currentPage.value = 1
  hasNextPage.value = false
  pageCursors.value = [null]
}

const loadPosts = async (page = 1) => {
  const cursor = page === 1 ? null : pageCursors.value[page - 1]
  if (page > 1 && cursor === undefined) return

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchBoardPosts({
      category: selectedCategory.value,
      cursor,
      size: PAGE_SIZE,
    })
    posts.value = response.items
    currentPage.value = page
    hasNextPage.value = response.hasNext
    if (response.hasNext) {
      pageCursors.value[page] = response.nextCursor
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)

watch(
  () => route.query.category,
  () => {
    resetPagination()
    loadPosts(1)
  },
)
</script>

<template>
  <div class="container board-page fade-in">
    <div class="board-top">
      <div>
        <h1 class="board-title">커뮤니티</h1>
        <p class="board-desc">공지, 자유 글, 질문을 한 곳에서 확인하세요.</p>
      </div>
      <RouterLink :to="writeTo" class="btn btn-primary">
        글쓰기
      </RouterLink>
    </div>

    <div class="category-tabs" aria-label="게시판 카테고리">
      <button
        v-for="category in categories"
        :key="category.label"
        type="button"
        class="category-tab"
        :class="{ active: selectedCategory === category.value, notice: category.value === 'NOTICE' }"
        @click="changeCategory(category.value)"
      >
        {{ category.label }}
      </button>
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
        <span class="col-category">분류</span>
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
        :class="{ notice: post.category === 'NOTICE' }"
      >
        <span class="col-id">{{ post.id }}</span>
        <span class="col-category">
          <span class="category-badge" :class="post.category?.toLowerCase()">
            {{ post.categoryLabel || categoryLabel(post.category) }}
          </span>
        </span>
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
      <p>{{ selectedCategoryLabel }} 게시판에 아직 작성된 글이 없습니다.</p>
      <RouterLink :to="writeTo" class="btn btn-outline">첫 글을 작성해보세요</RouterLink>
    </div>

    <div v-if="!loading && !errorMessage && posts.length > 0" class="pagination">
      <button
        type="button"
        class="page-button"
        :disabled="currentPage === 1"
        @click="loadPosts(currentPage - 1)"
      >
        이전
      </button>
      <button
        v-for="page in pageNumbers"
        :key="page"
        type="button"
        class="page-button"
        :class="{ active: currentPage === page }"
        @click="loadPosts(page)"
      >
        {{ page }}
      </button>
      <button
        type="button"
        class="page-button"
        :disabled="!hasNextPage"
        @click="loadPosts(currentPage + 1)"
      >
        다음
      </button>
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
  gap: var(--space-4);
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

.category-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  overflow-x: auto;
}

.category-tab {
  min-width: 72px;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  font-size: var(--font-sm);
  font-weight: 700;
  transition: all var(--transition-fast);
}

.category-tab:hover,
.category-tab.active {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

.category-tab.notice.active {
  border-color: #f87171;
  color: #b91c1c;
  background: #fef2f2;
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

.table-row.notice {
  background-color: #fff7f7;
}

.table-row.notice:hover {
  background-color: #fef2f2;
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

.col-category {
  width: 72px;
  text-align: center;
  flex-shrink: 0;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 24px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 800;
}

.category-badge.notice {
  background: #fee2e2;
  color: #b91c1c;
}

.category-badge.free {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.category-badge.question {
  background: #e0f2fe;
  color: #0369a1;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-8);
  flex-wrap: wrap;
}

.page-button {
  min-width: 42px;
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 700;
  transition: all var(--transition-fast);
}

.page-button:hover:not(:disabled),
.page-button.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.page-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 640px) {
  .board-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .col-author, .col-date, .col-views {
    display: none;
  }

  .col-category {
    width: 58px;
  }
}
</style>
