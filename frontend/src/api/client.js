import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('biosync_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('biosync_token')
      localStorage.removeItem('biosync_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const logsAPI = {
  create: (data) => api.post('/logs/', data),
  list: (limit = 30) => api.get(`/logs/?limit=${limit}`),
  getByDate: (date) => api.get(`/logs/${date}`),
  delete: (id) => api.delete(`/logs/${id}`),
}

export const healthAPI = {
  dashboard: () => api.get('/health/dashboard'),
  scores: (limit = 30) => api.get(`/health/scores?limit=${limit}`),
  risk: () => api.get('/health/risk'),
  trend: (metric) => api.get(`/health/trend/${metric}`),
}

export default api
