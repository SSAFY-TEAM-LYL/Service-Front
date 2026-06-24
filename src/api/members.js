import api, { unwrapApiResponse } from '@/api'

export async function fetchMyProfile() {
  return unwrapApiResponse(await api.get('/members/me'))
}

export async function fetchMySolvedStats() {
  return unwrapApiResponse(await api.get('/members/me/solved-stats'))
}

export async function fetchMemberRankings() {
  return unwrapApiResponse(await api.get('/members/rankings'))
}

export async function updateMyProfile(payload) {
  return unwrapApiResponse(await api.patch('/members/me', payload))
}

export async function withdrawMe(password) {
  return unwrapApiResponse(
    await api.delete('/members/me', {
      data: { password },
    }),
  )
}
