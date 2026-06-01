import api from '@/api'

export const fetchBoardPosts = async () => {
  const { data } = await api.get('/boards')
  return data
}

export const fetchBoardPost = async (id) => {
  const { data } = await api.get(`/boards/${id}`)
  return data
}

export const createBoardPost = async (payload) => {
  const { data } = await api.post('/boards', payload)
  return data
}
