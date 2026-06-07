import api, { unwrapApiResponse } from '@/api'

export const fetchBoardPosts = async () => {
  const response = await api.get('/boards')
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
