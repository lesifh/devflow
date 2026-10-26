import client from './client'
import type { Sprint } from '../types'

export async function getSprints(projectId: number): Promise<Sprint[]> {
  const res = await client.get<Sprint[]>(`/projects/${projectId}/sprints`)
  return res.data
}

export async function createSprint(projectId: number, data: { name: string; goal?: string }): Promise<Sprint> {
  const res = await client.post<Sprint>(`/projects/${projectId}/sprints`, data)
  return res.data
}