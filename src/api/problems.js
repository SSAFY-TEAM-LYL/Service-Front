import api, { unwrapApiResponse } from '@/api'

export const fetchProblems = async ({ cursor, size, difficulty, algorithm, query } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size
  if (difficulty) params.difficulty = difficulty
  if (algorithm) params.algorithm = algorithm
  if (query) params.query = query

  const response = await api.get('/problems', { params })
  return unwrapApiResponse(response)
}

export const fetchProblemSummary = async () => {
  const response = await api.get('/problems/summary')
  return unwrapApiResponse(response)
}

export const fetchProblemAlgorithms = async () => {
  const response = await api.get('/problems/algorithms')
  return unwrapApiResponse(response)
}

export const fetchProblem = async (problemId) => {
  const response = await api.get(`/problems/${problemId}`)
  return unwrapApiResponse(response)
}
