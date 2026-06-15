import api, { unwrapApiResponse } from '@/api'

export const fetchProblems = async ({ cursor, size } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size

  const response = await api.get('/problems', { params })
  return unwrapApiResponse(response)
}

export const fetchProblem = async (problemId) => {
  const response = await api.get(`/problems/${problemId}`)
  return unwrapApiResponse(response)
}
