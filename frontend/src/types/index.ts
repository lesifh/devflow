export interface User {
  id: number
  username: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
}

export interface Sprint {
  id: number
  project_id: number
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'active' | 'closed'
  created_at: string
}

export type WorkItemType = 'story' | 'task' | 'bug'
export type WorkItemStatus = 'todo' | 'doing' | 'review' | 'done'
export type WorkItemPriority = 'low' | 'medium' | 'high'

export interface WorkItem {
  id: number
  project_id: number
  sprint_id: number | null
  type: WorkItemType
  title: string
  description: string | null
  status: WorkItemStatus
  priority: WorkItemPriority
  assignee_id: number | null
  order: number
  created_at: string
  updated_at: string
}

export interface Board {
  todo: WorkItem[]
  doing: WorkItem[]
  review: WorkItem[]
  done: WorkItem[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}