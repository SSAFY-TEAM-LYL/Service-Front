import api, { unwrapApiResponse } from '@/api'

export const fetchProblemBankProblems = async ({ page, size } = {}) => {
  const params = {}
  if (page !== undefined && page !== null) params.page = page
  if (size) params.size = size

  const response = await api.get('/admin/problem-bank/problems', { params })
  return unwrapApiResponse(response)
}

export const fetchProblemPublications = async ({ cursor, size } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size

  const response = await api.get('/admin/problem-publications', { params })
  return unwrapApiResponse(response)
}

export const publishProblem = async ({ problemId }) => {
  const response = await api.post('/admin/problem-publications', { problemId })
  return unwrapApiResponse(response)
}

export const unpublishProblem = async (problemId) => {
  const response = await api.delete(`/admin/problem-publications/${problemId}`)
  return unwrapApiResponse(response)
}
