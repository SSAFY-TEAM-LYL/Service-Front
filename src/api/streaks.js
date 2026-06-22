import api, { unwrapApiResponse } from '@/api'

export const fetchMyStreak = async ({ days } = {}) => {
  const params = {}
  if (days) params.days = days

  const response = await api.get('/streaks/me', { params })
  return unwrapApiResponse(response)
}
