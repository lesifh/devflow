import axios from 'axios'
import { useAuth } from '../store/auth'

const client = axios.create({
  // 👈 核心配置：开发环境直连 8000，生产环境（打包后）走 Nginx 的 /api
  baseURL: import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动带上 token
client.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：401 自动跳登录
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuth.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client