const OAUTH_ERROR_MESSAGES = {
  OAUTH_ACCOUNT_CONFLICT:
    '이미 해당 이메일로 가입한 계정이 있습니다. 이메일과 비밀번호로 로그인해주세요.',
  OAUTH_EMAIL_REQUIRED: '소셜 계정에서 이메일을 확인할 수 없습니다. 이메일 제공 동의 후 다시 시도해주세요.',
  OAUTH_LOGIN_CODE_INVALID: '소셜 로그인 시간이 만료되었습니다. 다시 시도해주세요.',
  OAUTH_LOGIN_FAILED: '소셜 로그인에 실패했습니다. 다시 시도해주세요.',
  DELETED_MEMBER: '탈퇴처리한 회원입니다. 계정 복구 후 이용해주세요.',
}

const normalizeErrorCode = (error) =>
  String(error || '')
    .trim()
    .replace(/[-\s]/g, '_')
    .toUpperCase()

export const getOAuthErrorMessage = (error, fallback = OAUTH_ERROR_MESSAGES.OAUTH_LOGIN_FAILED) => {
  const code = normalizeErrorCode(Array.isArray(error) ? error[0] : error)
  return OAUTH_ERROR_MESSAGES[code] || fallback
}

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || getOAuthErrorMessage(error?.response?.data?.code, fallback)
