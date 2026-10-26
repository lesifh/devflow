import client from './client'
import type { Board, WorkItem } from '../types'

// 获取看板数据
export async function getBoard(projectId: number, sprintId?: number): Promise<Board> {
  const url = sprintId 
    ? `/projects/${projectId}/board?sprint_id=${sprintId}` 
    : `/projects/${projectId}/board`
  const res = await client.get<Board>(url)
  return res.data
}

// 创建工作项
export async function createWorkItem(projectId: number, data: { 
  title: string
  type: string
  sprint_id?: number
}): Promise<WorkItem> {
  const res = await client.post<WorkItem>(`/projects/${projectId}/items`, data)
  return res.data
}

// 更新工作项（用于拖动改状态）
export async function updateWorkItem(itemId: number, data: { status?: string, order?: number }): Promise<WorkItem> {
  const res = await client.put<WorkItem>(`/items/${itemId}`, data)
  return res.data
}