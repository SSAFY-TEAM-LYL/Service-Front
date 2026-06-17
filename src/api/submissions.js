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

export const updateSubmission = async (submissionId, { language, sourceCode }) => {
  const response = await api.put(`/submissions/${submissionId}`, {
    language,
    sourceCode,
  })
  return unwrapApiResponse(response)
}

export const deleteSubmission = async (submissionId) => {
  const response = await api.delete(`/submissions/${submissionId}`)
  return unwrapApiResponse(response)
}

export const fetchProblemSubmissions = async (problemId, { cursor, size } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size

  const response = await api.get(`/problems/${problemId}/submissions`, { params })
  return unwrapApiResponse(response)
}

export const fetchSubmissionReviews = async (submissionId, { cursor, size } = {}) => {
  const params = {}
  if (cursor) params.cursor = cursor
  if (size) params.size = size

  const response = await api.get(`/submissions/${submissionId}/reviews`, { params })
  return unwrapApiResponse(response)
}

export const createSubmissionReview = async (submissionId, { content }) => {
  const response = await api.post(`/submissions/${submissionId}/reviews`, { content })
  return unwrapApiResponse(response)
}

export const updateSubmissionReview = async (reviewId, { content }) => {
  const response = await api.put(`/submission-reviews/${reviewId}`, { content })
  return unwrapApiResponse(response)
}

export const deleteSubmissionReview = async (reviewId) => {
  const response = await api.delete(`/submission-reviews/${reviewId}`)
  return unwrapApiResponse(response)
}
