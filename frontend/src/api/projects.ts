import client from './client'
import type { Project } from '../types'

export async function getProjects(): Promise<Project[]> {
  const res = await client.get<Project[]>('/projects')
  return res.data
}

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const res = await client.post<Project>('/projects', data)
  return res.data
}

export async function deleteProject(projectId: number): Promise<void> {
  await client.delete(`/projects/${projectId}`)
}