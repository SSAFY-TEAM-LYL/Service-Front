<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AqLogo from '@/components/AqLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { applyUiSettings, readStoredUiSettings } from '@/utils/uiSettings'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const navImageFailed = ref(false)
const isProfileOpen = ref(false)

const authRouteNames = ['login', 'signup', 'account-restore', 'oauth-callback']

const isAuthLayout = computed(() => authRouteNames.includes(route.name))
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const showNavProfileImage = computed(() => auth.user?.profileImageUrl && !navImageFailed.value)
const avatarInitial = computed(() => (auth.user?.nickname || 'U').slice(0, 1).toUpperCase())
const pageTitle = computed(() => route.meta?.title || routeTitleMap[route.name] || '대시보드')

const mainNavItems = [
  { to: '/', label: '대시보드', icon: '▦' },
  { to: '/problems', label: '문제풀기', icon: '</>' },
  { to: '/board', label: '게시판', icon: '□' },
]

const routeTitleMap = {
  main: '대시보드',
  problems: '문제풀기',
  'problem-detail': '문제풀기',
  'problem-submissions': '제출내역',
  board: '게시판',
  'board-write': '글쓰기',
  'board-detail': '게시글',
  mypage: '내 정보',
  'admin-problem-publications': '문제 공개 관리',
  settings: '설정',
}

watch(
  () => auth.user?.profileImageUrl,
  () => {
    navImageFailed.value = false
  },
)

watch(
  () => route.fullPath,
  () => {
    isProfileOpen.value = false
  },
)

const toggleProfileMenu = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const handleLogout = () => {
  auth.logout()
  isProfileOpen.value = false
  router.push('/')
}

onMounted(() => {
  applyUiSettings(readStoredUiSettings())
})
</script>

<template>
  <RouterView v-if="isAuthLayout" />

  <div v-else class="app-shell">
    <aside class="sidebar" aria-label="주요 메뉴">
      <RouterLink to="/" class="brand" aria-label="알트 홈">
        <span class="brand-mark">
          <AqLogo class="brand-logo" />
        </span>
        <span class="brand-copy">
          <strong>알트</strong>
          <small>▶ ALGORITHM TRAINING</small>
        </span>
      </RouterLink>

      <section class="status-panel compact-status" aria-label="서비스 상태">
        <p class="panel-eyebrow">■ ALT STATUS</p>
        <div class="compact-status-grid">
          <RouterLink to="/problems">
            <span>QUESTS</span>
            <strong>READY</strong>
          </RouterLink>
          <RouterLink to="/board">
            <span>COMMUNITY</span>
            <strong>LIVE</strong>
          </RouterLink>
        </div>
      </section>

      <nav class="nav-groups">
        <p class="nav-section-title">MAIN MENU</p>
        <div class="nav-list">
          <RouterLink v-for="item in mainNavItems" :key="item.to" :to="item.to" class="nav-link">
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>

        <template v-if="isAdmin">
          <p class="nav-section-title">ADMIN</p>
          <div class="nav-list">
            <RouterLink to="/admin/problem-publications" class="nav-link">
              <span class="nav-icon">▣</span>
              <span>문제 공개 관리</span>
            </RouterLink>
          </div>
        </template>
      </nav>

      <div class="side-profile">
        <RouterLink to="/settings" class="side-settings-link">
          <span class="nav-icon">⚙</span>
          <span>SETTINGS</span>
        </RouterLink>

        <RouterLink v-if="auth.isLoggedIn" to="/mypage" class="side-player-card">
          <img
            v-if="showNavProfileImage"
            :src="auth.user.profileImageUrl"
            :alt="`${auth.user?.nickname || '사용자'} 프로필`"
            class="side-player-avatar side-player-image"
            @error="navImageFailed = true"
          />
          <span v-else class="side-player-avatar">{{ avatarInitial }}</span>
          <span>
            <strong>{{ auth.user?.nickname || '사용자' }}</strong>
            <p>{{ auth.user?.email || '계정 정보' }}</p>
          </span>
        </RouterLink>

        <RouterLink v-else to="/login" class="side-player-card">
          <span class="side-player-avatar">?</span>
          <span>
            <strong>게스트</strong>
            <p>로그인 후 제출 가능</p>
          </span>
        </RouterLink>
      </div>
    </aside>

    <main class="app-main">
      <header class="topbar">
        <h1>{{ pageTitle }}</h1>
        <div class="top-actions">
          <RouterLink to="/problems" class="top-search" aria-label="문제 목록으로 이동">
            <span>⌕</span>
            <span class="search">문제 목록</span>
            <kbd>GO</kbd>
          </RouterLink>

          <div class="profile-menu">
            <button
              type="button"
              class="top-icon-btn top-profile-btn"
              :aria-expanded="isProfileOpen"
              aria-haspopup="menu"
              @click="toggleProfileMenu"
            >
              <img
                v-if="showNavProfileImage"
                :src="auth.user.profileImageUrl"
                :alt="`${auth.user?.nickname || '사용자'} 프로필`"
                class="top-avatar top-avatar-image"
                @error="navImageFailed = true"
              />
              <span v-else class="top-avatar">{{ avatarInitial }}</span>
              <span>{{ auth.isLoggedIn ? auth.user?.nickname || '사용자' : '로그인' }}</span>
              <span aria-hidden="true">⌄</span>
            </button>

            <div v-if="isProfileOpen" class="dropdown-panel profile-dropdown" role="menu">
              <template v-if="auth.isLoggedIn">
                <p class="dropdown-title">{{ auth.user?.email }}</p>
                <RouterLink to="/mypage" class="dropdown-item" role="menuitem">내 정보 수정</RouterLink>
                <button type="button" class="dropdown-item" role="menuitem" @click="handleLogout">
                  로그아웃
                </button>
              </template>
              <template v-else>
                <RouterLink to="/login" class="dropdown-item" role="menuitem">로그인</RouterLink>
                <RouterLink to="/signup" class="dropdown-item" role="menuitem">회원가입</RouterLink>
              </template>
            </div>
          </div>
        </div>
      </header>

      <section class="content">
        <RouterView />
      </section>
    </main>
  </div>
</template>
