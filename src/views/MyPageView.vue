<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const profileForm = reactive({
  nickname: auth.user?.nickname || '',
  password: '',
  profileImageUrl: auth.user?.profileImageUrl || '',
})
const withdrawalForm = reactive({
  password: '',
})

const profileErrors = ref({})
const withdrawalError = ref('')
const profileMessage = ref('')
const withdrawalMessage = ref('')
const isSaving = ref(false)
const isWithdrawing = ref(false)
const imageLoadFailed = ref(false)

watch(
  () => auth.user,
  (user) => {
    profileForm.nickname = user?.nickname || ''
    profileForm.profileImageUrl = user?.profileImageUrl || ''
    imageLoadFailed.value = false
  },
  { immediate: true },
)

const avatarInitial = computed(() => (auth.user?.nickname || 'U').slice(0, 1).toUpperCase())
const previewUrl = computed(() => profileForm.profileImageUrl.trim())
const canShowPreviewImage = computed(() => previewUrl.value && !imageLoadFailed.value)

const validateProfile = () => {
  const errors = {}
  if (!profileForm.nickname.trim()) errors.nickname = '닉네임을 입력해주세요.'
  if (profileForm.nickname.trim().length > 30) errors.nickname = '닉네임은 30자 이하여야 합니다.'
  if (profileForm.password && profileForm.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  if (profileForm.profileImageUrl.trim().length > 500) {
    errors.profileImageUrl = '프로필 이미지 URL은 500자 이하여야 합니다.'
  }
  profileErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleProfileSubmit = async () => {
  if (!validateProfile()) return

  isSaving.value = true
  profileMessage.value = ''
  try {
    await auth.updateProfile({
      nickname: profileForm.nickname.trim(),
      password: profileForm.password || null,
      profileImageUrl: profileForm.profileImageUrl.trim() || null,
    })
    profileForm.password = ''
    profileMessage.value = '회원정보가 수정되었습니다.'
  } catch (error) {
    profileErrors.value.general = error.response?.data?.message || '회원정보 수정에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

const handleWithdrawal = async () => {
  withdrawalError.value = ''
  withdrawalMessage.value = ''
  const confirmed = window.confirm('회원탈퇴 후 같은 이메일은 계정 복구를 통해 다시 사용할 수 있습니다. 탈퇴하시겠어요?')
  if (!confirmed) return

  isWithdrawing.value = true
  try {
    await auth.withdraw(withdrawalForm.password)
    withdrawalMessage.value = '회원탈퇴가 완료되었습니다.'
    router.push('/')
  } catch (error) {
    withdrawalError.value = error.response?.data?.message || '회원탈퇴에 실패했습니다.'
  } finally {
    isWithdrawing.value = false
  }
}
</script>

<template>
  <section class="mypage">
    <div class="container mypage-inner">
      <aside class="profile-summary">
        <div class="profile-avatar-wrap">
          <img
            v-if="auth.user?.profileImageUrl"
            :src="auth.user.profileImageUrl"
            :alt="`${auth.user?.nickname || '사용자'} 프로필`"
            class="profile-avatar"
          />
          <span v-else class="profile-avatar profile-avatar-fallback">{{ avatarInitial }}</span>
        </div>
        <div>
          <h1>{{ auth.user?.nickname || '사용자' }}</h1>
          <p>{{ auth.user?.email }}</p>
          <div class="level-summary">
            <span>Lv. {{ auth.user?.level || 1 }}</span>
            <span>{{ auth.user?.xp || 0 }} XP</span>
          </div>
        </div>
      </aside>

      <div class="settings">
        <section class="settings-section">
          <div class="section-header">
            <h2>회원정보 수정</h2>
            <p>닉네임, 비밀번호, 프로필 이미지를 변경할 수 있습니다.</p>
          </div>

          <form class="settings-form" @submit.prevent="handleProfileSubmit">
            <div class="profile-preview">
              <img
                v-if="canShowPreviewImage"
                :src="previewUrl"
                alt="프로필 이미지 미리보기"
                class="preview-avatar"
                @error="imageLoadFailed = true"
                @load="imageLoadFailed = false"
              />
              <span v-else class="preview-avatar preview-avatar-fallback">{{ avatarInitial }}</span>
            </div>

            <div class="input-group">
              <label for="mypage-nickname">닉네임</label>
              <input
                id="mypage-nickname"
                v-model="profileForm.nickname"
                type="text"
                :class="{ 'input-error': profileErrors.nickname }"
              />
              <p v-if="profileErrors.nickname" class="error-text">{{ profileErrors.nickname }}</p>
            </div>

            <div class="input-group">
              <label for="mypage-password">새 비밀번호</label>
              <input
                id="mypage-password"
                v-model="profileForm.password"
                type="password"
                autocomplete="new-password"
                placeholder="변경할 때만 입력하세요"
                :class="{ 'input-error': profileErrors.password }"
              />
              <p v-if="profileErrors.password" class="error-text">{{ profileErrors.password }}</p>
            </div>

            <div class="input-group">
              <label for="mypage-profile-image">프로필 이미지 URL</label>
              <input
                id="mypage-profile-image"
                v-model="profileForm.profileImageUrl"
                type="url"
                placeholder="https://example.com/profile.png"
                :class="{ 'input-error': profileErrors.profileImageUrl }"
                @input="imageLoadFailed = false"
              />
              <p v-if="profileErrors.profileImageUrl" class="error-text">{{ profileErrors.profileImageUrl }}</p>
            </div>

            <p v-if="profileErrors.general" class="error-text">{{ profileErrors.general }}</p>
            <p v-if="profileMessage" class="success-text">{{ profileMessage }}</p>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                {{ isSaving ? '저장 중...' : '저장하기' }}
              </button>
            </div>
          </form>
        </section>

        <section class="settings-section danger-section">
          <div class="section-header">
            <h2>회원탈퇴</h2>
            <p>탈퇴 시 계정은 soft delete 처리되며, 같은 이메일은 복구 후 다시 사용할 수 있습니다.</p>
          </div>

          <form class="settings-form" @submit.prevent="handleWithdrawal">
            <div class="input-group">
              <label for="withdrawal-password">현재 비밀번호</label>
              <input
                id="withdrawal-password"
                v-model="withdrawalForm.password"
                type="password"
                autocomplete="current-password"
                placeholder="소셜 로그인 계정은 비워둘 수 있습니다"
                :class="{ 'input-error': withdrawalError }"
              />
              <p v-if="withdrawalError" class="error-text">{{ withdrawalError }}</p>
              <p v-if="withdrawalMessage" class="success-text">{{ withdrawalMessage }}</p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-danger" :disabled="isWithdrawing">
                {{ isWithdrawing ? '처리 중...' : '회원탈퇴' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mypage {
  min-height: 100%;
  padding: 0;
  background: transparent;
}

.mypage-inner {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--space-8);
}

.profile-summary,
.settings-section {
  background: var(--color-bg);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.profile-summary {
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}

.profile-avatar-wrap {
  width: 96px;
  height: 96px;
}

.profile-avatar,
.preview-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--color-border);
  box-shadow: 3px 3px 0 var(--color-border-light);
}

.profile-avatar-fallback,
.preview-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
  font-weight: 800;
}

.profile-avatar-fallback {
  font-size: var(--font-3xl);
}

.profile-summary h1 {
  font-size: var(--font-2xl);
  font-family: var(--font-mono);
  font-weight: 950;
  margin-bottom: var(--space-1);
}

.profile-summary p,
.section-header p {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.level-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.level-summary span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 var(--space-3);
  border: 2px solid var(--color-border);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 950;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-section {
  padding: var(--space-6);
}

.section-header {
  margin-bottom: var(--space-6);
}

.section-header h2 {
  font-size: var(--font-xl);
  font-family: var(--font-mono);
  font-weight: 950;
  margin-bottom: var(--space-1);
}

.settings-form {
  max-width: none;
}

.profile-preview {
  width: 88px;
  height: 88px;
  margin-bottom: var(--space-5);
}

.preview-avatar-fallback {
  font-size: var(--font-2xl);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.success-text {
  color: var(--color-primary-dark);
  font-size: var(--font-sm);
  margin-bottom: var(--space-4);
}

.danger-section {
  border-color: #fecaca;
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 760px) {
  .mypage {
    padding-top: var(--space-6);
  }

  .mypage-inner {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .profile-summary {
    flex-direction: row;
    align-items: center;
  }

  .profile-avatar-wrap {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
  }

  .settings-section {
    padding: var(--space-6);
  }
}
</style>
