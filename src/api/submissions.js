import api, { unwrapApiResponse } from '@/api'

export const createSubmission = async (problemId, { language, sourceCode }) => {
  const response = await api.post(`/problems/${problemId}/submissions`, {
    language,
    sourceCode,
  })
  return unwrapApiResponse(response)
}

export const fetchSubmission = async (submissionId) => {
  const response = await api.get(`/submissions/${submissionId}`)
  return unwrapApiResponse(response)
}

export const fetchProblemSubmissions = async (problemId, { cursor, size } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size

  const response = await api.get(`/problems/${problemId}/submissions`, { params })
  return unwrapApiResponse(response)
}
