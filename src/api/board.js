import api, { unwrapApiResponse } from '@/api'

export const fetchBoardPosts = async (category) => {
  const response = await api.get('/boards', {
    params: category ? { category } : undefined,
  })
  return unwrapApiResponse(response)
}

export const fetchBoardPost = async (id) => {
  const response = await api.get(`/boards/${id}`)
  return unwrapApiResponse(response)
}

export const createBoardPost = async (payload) => {
  const response = await api.post('/boards', payload)
  return unwrapApiResponse(response)
}

export const updateBoardPost = async (id, payload) => {
  const response = await api.put(`/boards/${id}`, payload)
  return unwrapApiResponse(response)
}

export const deleteBoardPost = async (id) => {
  const response = await api.delete(`/boards/${id}`)
  return unwrapApiResponse(response)
}

export const fetchBoardComments = async (postId) => {
  const response = await api.get(`/boards/${postId}/comments`)
  return unwrapApiResponse(response)
}

export const createBoardComment = async (postId, payload) => {
  const response = await api.post(`/boards/${postId}/comments`, payload)
  return unwrapApiResponse(response)
}

export const updateBoardComment = async (commentId, payload) => {
  const response = await api.put(`/comments/${commentId}`, payload)
  return unwrapApiResponse(response)
}

export const deleteBoardComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`)
  return unwrapApiResponse(response)
}
