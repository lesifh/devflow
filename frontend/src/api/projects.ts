import client from './client'
import type { Project } from '../types'

export async function getProjects(isArchived = false): Promise<Project[]> {
  const res = await client.get<Project[]>(`/projects?is_archived=${isArchived}`)
  return res.data
}

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const res = await client.post<Project>('/projects', data)
  return res.data
}

export async function deleteProject(projectId: number): Promise<void> {
  await client.delete(`/projects/${projectId}`)
}

export async function archiveProject(projectId: number, isArchived: boolean): Promise<Project> {
  const res = await client.put<Project>(`/projects/${projectId}`, { is_archived: isArchived })
  return res.data
}