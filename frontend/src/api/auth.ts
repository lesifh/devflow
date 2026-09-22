import client from './client'
import type { TokenResponse, User } from '../types'

export async function register(username: string, password: string): Promise<User> {
  const res = await client.post<User>('/auth/register', { username, password })
  return res.data
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', { username, password })
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/auth/me')
  return res.data
}