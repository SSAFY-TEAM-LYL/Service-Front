<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  createBoardComment,
  deleteBoardComment,
  deleteBoardPost,
  fetchBoardComments,
  fetchBoardPost,
  updateBoardComment,
  updateBoardPost,
} from '@/api/board'
import { useAuthStore } from '@/stores/auth'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const COMMENT_PAGE_SIZE = 10

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const commentsLoading = ref(false)
const commentsLoadingMore = ref(false)
const commentCursor = ref(null)
const hasMoreComments = ref(false)
const commentSentinel = ref(null)
const errorMessage = ref('')
const actionError = ref('')
let commentObserver = null

const isEditingPost = ref(false)
const editTitle = ref('')
const editContent = ref('')
const postSaving = ref(false)
const postDeleting = ref(false)

const commentContent = ref('')
const commentSubmitting = ref(false)
const commentError = ref('')
const editingCommentId = ref(null)
const editingCommentContent = ref('')
const commentActionId = ref(null)

const postId = computed(() => route.params.id)
const renderedPostContent = computed(() => renderMarkdown(post.value?.content || ''))
const renderedEditContent = computed(() => renderMarkdown(editContent.value))
const listTo = computed(() => ({
  name: 'board',
  query: post.value?.category ? { category: post.value.category } : {},
}))
const isPostAuthor = computed(() => {
  return post.value && auth.user && Number(post.value.authorId) === Number(auth.user.id)
})

const commentLoginTo = computed(() => ({
  name: 'login',
  query: { redirect: route.fullPath },
}))

const isCommentAuthor = (comment) => {
  return auth.user && Number(comment.authorId) === Number(auth.user.id)
}

const appendUniqueComments = (newComments) => {
  const existingIds = new Set(comments.value.map((comment) => comment.id))
  comments.value = [
    ...comments.value,
    ...newComments.filter((comment) => !existingIds.has(comment.id)),
  ]
}

const categoryLabel = (category) => {
  const labels = {
    NOTICE: '공지',
    FREE: '자유',
    QUESTION: '질문',
  }
  return labels[category] || category
}

const observeCommentSentinel = async () => {
  await nextTick()
  if (commentObserver) {
    commentObserver.disconnect()
  }
  if (!commentSentinel.value || !hasMoreComments.value) return

  commentObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      loadComments()
    }
  }, { rootMargin: '160px' })
  commentObserver.observe(commentSentinel.value)
}

const loadComments = async ({ reset = false } = {}) => {
  if (commentsLoading.value || commentsLoadingMore.value) return

  if (reset) {
    comments.value = []
    commentCursor.value = null
    hasMoreComments.value = false
    commentsLoading.value = true
  } else {
    if (!hasMoreComments.value) return
    commentsLoadingMore.value = true
  }

  try {
    const response = await fetchBoardComments(postId.value, {
      cursor: reset ? null : commentCursor.value,
      size: COMMENT_PAGE_SIZE,
    })
    if (reset) {
      comments.value = response.items
    } else {
      appendUniqueComments(response.items)
    }
    commentCursor.value = response.nextCursor
    hasMoreComments.value = response.hasNext
    await observeCommentSentinel()
  } catch (error) {
    commentError.value = error.response?.data?.message || '댓글을 불러오지 못했습니다.'
  } finally {
    commentsLoading.value = false
    commentsLoadingMore.value = false
  }
}

const loadPost = async () => {
  try {
    post.value = await fetchBoardPost(postId.value)
    await loadComments({ reset: true })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '게시글을 불러오지 못했습니다.'
    post.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadPost)

onBeforeUnmount(() => {
  if (commentObserver) {
    commentObserver.disconnect()
  }
})

const startPostEdit = () => {
  actionError.value = ''
  editTitle.value = post.value.title
  editContent.value = post.value.content
  isEditingPost.value = true
}

const cancelPostEdit = () => {
  isEditingPost.value = false
  actionError.value = ''
}

const submitPostEdit = async () => {
  const title = editTitle.value.trim()
  const content = editContent.value.trim()
  if (!title || !content) {
    actionError.value = '제목과 내용을 모두 입력해주세요.'
    return
  }

  postSaving.value = true
  actionError.value = ''
  try {
    post.value = await updateBoardPost(post.value.id, {
      category: post.value.category,
      title,
      content,
    })
    isEditingPost.value = false
  } catch (error) {
    actionError.value = error.response?.data?.message || '게시글 수정에 실패했습니다.'
  } finally {
    postSaving.value = false
  }
}

const removePost = async () => {
  if (!confirm('게시글을 삭제하시겠습니까?')) return

  postDeleting.value = true
  actionError.value = ''
  try {
    await deleteBoardPost(post.value.id)
    router.push('/board')
  } catch (error) {
    actionError.value = error.response?.data?.message || '게시글 삭제에 실패했습니다.'
  } finally {
    postDeleting.value = false
  }
}

const submitComment = async () => {
  const content = commentContent.value.trim()
  if (!content) {
    commentError.value = '댓글 내용을 입력해주세요.'
    return
  }

  commentSubmitting.value = true
  commentError.value = ''
  try {
    const created = await createBoardComment(post.value.id, { content })
    comments.value = [...comments.value, created]
    post.value = {
      ...post.value,
      comments: (post.value.comments || 0) + 1,
    }
    commentContent.value = ''
  } catch (error) {
    commentError.value = error.response?.data?.message || '댓글 작성에 실패했습니다.'
  } finally {
    commentSubmitting.value = false
  }
}

const startCommentEdit = (comment) => {
  commentError.value = ''
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
}

const cancelCommentEdit = () => {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

const submitCommentEdit = async (comment) => {
  const content = editingCommentContent.value.trim()
  if (!content) {
    commentError.value = '댓글 내용을 입력해주세요.'
    return
  }

  commentActionId.value = comment.id
  commentError.value = ''
  try {
    const updated = await updateBoardComment(comment.id, { content })
    comments.value = comments.value.map((item) => (item.id === updated.id ? updated : item))
    cancelCommentEdit()
  } catch (error) {
    commentError.value = error.response?.data?.message || '댓글 수정에 실패했습니다.'
  } finally {
    commentActionId.value = null
  }
}

const removeComment = async (comment) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return

  commentActionId.value = comment.id
  commentError.value = ''
  try {
    await deleteBoardComment(comment.id)
    comments.value = comments.value.filter((item) => item.id !== comment.id)
    post.value = {
      ...post.value,
      comments: Math.max((post.value.comments || 1) - 1, 0),
    }
  } catch (error) {
    commentError.value = error.response?.data?.message || '댓글 삭제에 실패했습니다.'
  } finally {
    commentActionId.value = null
  }
}
</script>

<template>
  <div class="container detail-page">
    <div v-if="loading" class="detail-loading">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="!post" class="detail-empty fade-in">
      <h2>게시글을 찾을 수 없습니다</h2>
      <p>{{ errorMessage || '삭제되었거나 존재하지 않는 게시글입니다.' }}</p>
      <RouterLink to="/board" class="btn btn-outline detail-empty-action">목록으로</RouterLink>
    </div>

    <article v-else class="detail-article fade-in">
      <RouterLink :to="listTo" class="back-link">목록으로</RouterLink>

      <header class="detail-header">
        <div class="detail-heading">
          <div class="detail-title-group">
            <span class="category-badge" :class="post.category?.toLowerCase()">
              {{ post.categoryLabel || categoryLabel(post.category) }}
            </span>
            <h1 v-if="!isEditingPost" class="detail-title">{{ post.title }}</h1>
            <input
              v-else
              v-model="editTitle"
              class="edit-title-input"
              type="text"
              aria-label="게시글 제목"
            />

            <div class="detail-meta">
              <span class="meta-author">{{ post.author }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-date">{{ post.date }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-views">조회 {{ post.views }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-comments">댓글 {{ post.comments }}</span>
            </div>
          </div>

          <div v-if="isPostAuthor" class="post-actions">
            <template v-if="isEditingPost">
              <button class="btn btn-outline btn-sm" type="button" @click="cancelPostEdit">취소</button>
              <button
                class="btn btn-primary btn-sm"
                type="button"
                :disabled="postSaving"
                @click="submitPostEdit"
              >
                {{ postSaving ? '저장 중...' : '저장' }}
              </button>
            </template>
            <template v-else>
              <button class="btn btn-outline btn-sm" type="button" @click="startPostEdit">수정</button>
              <button
                class="btn btn-danger btn-sm"
                type="button"
                :disabled="postDeleting"
                @click="removePost"
              >
                {{ postDeleting ? '삭제 중...' : '삭제' }}
              </button>
            </template>
          </div>
        </div>

        <p v-if="actionError" class="error-text action-error">{{ actionError }}</p>
      </header>

      <div v-if="!isEditingPost" class="detail-body markdown-body" v-html="renderedPostContent"></div>

      <div v-else class="detail-edit-body">
        <div class="markdown-editor">
          <textarea v-model="editContent" rows="14" aria-label="게시글 내용"></textarea>
          <div class="markdown-preview" aria-label="Markdown 미리보기">
            <div v-if="editContent.trim()" class="markdown-body" v-html="renderedEditContent"></div>
            <p v-else class="preview-empty">미리보기</p>
          </div>
        </div>
      </div>

      <section class="comments-section">
        <div class="comments-header">
          <h2>댓글</h2>
          <span>{{ comments.length }}</span>
        </div>

        <form v-if="auth.isLoggedIn" class="comment-form" @submit.prevent="submitComment">
          <textarea
            v-model="commentContent"
            rows="4"
            placeholder="댓글을 입력하세요"
            aria-label="댓글 내용"
          ></textarea>
          <div class="comment-form-actions">
            <p v-if="commentError && !editingCommentId" class="error-text">{{ commentError }}</p>
            <button class="btn btn-primary btn-sm" type="submit" :disabled="commentSubmitting">
              {{ commentSubmitting ? '등록 중...' : '댓글 등록' }}
            </button>
          </div>
        </form>

        <div v-else class="comment-login">
          <RouterLink :to="commentLoginTo" class="btn btn-outline btn-sm">로그인하고 댓글 작성</RouterLink>
        </div>

        <div v-if="commentsLoading" class="comments-state">
          <p>댓글을 불러오는 중...</p>
        </div>

        <div v-else-if="comments.length === 0" class="comments-state">
          <p>아직 댓글이 없습니다.</p>
        </div>

        <ul v-else class="comment-list">
          <li v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-meta">
              <strong>{{ comment.author }}</strong>
              <span>{{ comment.date }}</span>
            </div>

            <template v-if="editingCommentId === comment.id">
              <textarea
                v-model="editingCommentContent"
                class="comment-edit-input"
                rows="3"
                aria-label="댓글 수정 내용"
              ></textarea>
              <p v-if="commentError" class="error-text comment-error">{{ commentError }}</p>
              <div class="comment-actions">
                <button class="btn btn-outline btn-sm" type="button" @click="cancelCommentEdit">취소</button>
                <button
                  class="btn btn-primary btn-sm"
                  type="button"
                  :disabled="commentActionId === comment.id"
                  @click="submitCommentEdit(comment)"
                >
                  {{ commentActionId === comment.id ? '저장 중...' : '저장' }}
                </button>
              </div>
            </template>

            <template v-else>
              <p class="comment-content">{{ comment.content }}</p>
              <div v-if="isCommentAuthor(comment)" class="comment-actions">
                <button class="text-button" type="button" @click="startCommentEdit(comment)">수정</button>
                <button
                  class="text-button text-danger"
                  type="button"
                  :disabled="commentActionId === comment.id"
                  @click="removeComment(comment)"
                >
                  {{ commentActionId === comment.id ? '삭제 중...' : '삭제' }}
                </button>
              </div>
            </template>
          </li>
        </ul>

        <div
          v-if="hasMoreComments || commentsLoadingMore"
          ref="commentSentinel"
          class="comments-more-state"
        >
          <p>{{ commentsLoadingMore ? '댓글을 더 불러오는 중...' : ' ' }}</p>
        </div>
      </section>

      <footer class="detail-footer">
        <RouterLink :to="listTo" class="btn btn-outline">목록</RouterLink>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: none;
  padding: 0;
}

.detail-article,
.detail-empty,
.detail-loading {
  border: 3px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.detail-article {
  padding: clamp(var(--space-6), 3vw, var(--space-10));
}

.detail-loading,
.detail-empty {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  color: var(--color-text-muted);
}

.detail-empty h2 {
  margin-bottom: var(--space-2);
  color: var(--color-text);
}

.detail-empty-action {
  margin-top: var(--space-4);
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
  border-bottom: 3px solid var(--color-border-light);
  margin-bottom: var(--space-8);
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.detail-title-group {
  flex: 1;
  min-width: 0;
}

.detail-title {
  font-size: var(--font-2xl);
  font-family: var(--font-mono);
  font-weight: 950;
  line-height: 1.3;
  margin-bottom: var(--space-3);
  overflow-wrap: anywhere;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 24px;
  margin-bottom: var(--space-3);
  padding: 0 var(--space-2);
  border: 2px solid currentColor;
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  font-weight: 900;
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

.edit-title-input,
.detail-edit-body textarea,
.comment-form textarea,
.comment-edit-input {
  width: 100%;
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
  transition: all var(--transition-fast);
}

.edit-title-input {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-xl);
  font-weight: 700;
  margin-bottom: var(--space-3);
}

.detail-edit-body textarea,
.comment-form textarea,
.comment-edit-input {
  padding: var(--space-3) var(--space-4);
  resize: vertical;
  line-height: 1.7;
}

.edit-title-input:focus,
.detail-edit-body textarea:focus,
.comment-form textarea:focus,
.comment-edit-input:focus {
  border-color: var(--color-primary);
  box-shadow: 4px 4px 0 var(--color-border-light);
}

.detail-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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

.post-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.action-error {
  margin-top: var(--space-3);
}

.detail-body {
  line-height: 1.9;
  font-size: var(--font-base);
  color: var(--color-text);
  min-height: 200px;
}

.markdown-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
}

.markdown-preview {
  min-height: 320px;
  padding: var(--space-4);
  border: 3px solid var(--color-border-light);
  background: var(--color-surface);
  overflow: auto;
}

.preview-empty {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.comments-section {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 3px solid var(--color-border-light);
}

.comments-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.comments-header h2 {
  font-size: var(--font-lg);
  font-family: var(--font-mono);
  font-weight: 950;
}

.comments-header span {
  color: var(--color-primary-dark);
  font-weight: 700;
  font-size: var(--font-sm);
}

.comment-form {
  margin-bottom: var(--space-6);
}

.comment-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.comment-login,
.comments-state,
.comments-more-state {
  padding: var(--space-5) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.comments-more-state {
  min-height: 48px;
  text-align: center;
}

.comment-list {
  list-style: none;
  border-top: 3px solid var(--color-border-light);
}

.comment-item {
  padding: var(--space-5) 0;
  border-bottom: 2px solid var(--color-border-light);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.comment-meta strong {
  font-size: var(--font-sm);
}

.comment-meta span {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.comment-content {
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.comment-error {
  margin-top: var(--space-2);
}

.text-button {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  font-weight: 600;
}

.text-button:hover {
  color: var(--color-primary);
}

.text-danger {
  color: var(--color-error);
}

.btn-danger {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.btn-danger:hover {
  background-color: var(--color-error);
  color: #fff;
}

.btn:disabled,
.text-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.detail-footer {
  margin-top: var(--space-10);
  padding-top: var(--space-6);
  border-top: 3px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

@media (max-width: 640px) {
  .detail-heading {
    flex-direction: column;
  }

  .post-actions,
  .comment-form-actions,
  .comment-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}

@media (max-width: 900px) {
  .markdown-editor {
    grid-template-columns: 1fr;
  }
}
</style>
