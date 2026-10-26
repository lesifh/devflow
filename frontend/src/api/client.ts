import axios from 'axios'
import { useAuth } from '../store/auth'   // 引入 store

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = useAuth.getState().token  // 从 Zustand 拿 token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuth.getState().logout()         // 调用 Zustand 的登出
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client