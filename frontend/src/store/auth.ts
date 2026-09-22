import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
// Zustand 管理全局状态（token、user）

// persist 中间件自动存到 localStorage，刷新页面不丢

// setAuth：登录成功时调用

// logout：退出时调用
interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null })
      },
    }),
    { name: 'auth-storage' }
  )
)