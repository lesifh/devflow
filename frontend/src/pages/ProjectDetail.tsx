import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSprints, createSprint } from '../api/sprints'
import type { Sprint } from '../types'

export default function ProjectDetail() {
  const { id } = useParams()  // 从 URL 拿项目 ID
  const projectId = Number(id)
  
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [name, setName] = useState('')
  const navigate = useNavigate()

  async function loadSprints() {
    try {
      const data = await getSprints(projectId)
      setSprints(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadSprints()
  }, [projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createSprint(projectId, { name })
      setName('')
      loadSprints()
    } catch (err) {
      alert('创建迭代失败')
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <button onClick={() => navigate('/projects')} style={{ marginBottom: 20 }}>
        ← 返回项目列表
      </button>

      <h1>项目详情 (ID: {projectId})</h1>

      <div style={{ marginTop: 40 }}>
        <h2>迭代列表 (Sprints)</h2>
        
        <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="新迭代名称（例如：Sprint 1）"
            style={{ padding: 8, width: 300, marginRight: 10 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>新建迭代</button>
        </form>

        {sprints.length === 0 ? (
          <p>还没有迭代，先建一个吧！</p>
        ) : (
          <div>
            {sprints.map((s) => (
              <div 
                key={s.id} 
                // 这里就是跳转进看板的逻辑
                onClick={() => navigate(`/projects/${projectId}/sprints/${s.id}`)}
                style={{ 
                  border: '1px solid #ccc', 
                  padding: 16, 
                  marginBottom: 10, 
                  borderRadius: 6, 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <h3>{s.name}</h3>
                <p style={{ color: '#666' }}>{s.goal || '无目标'}</p>
                <span style={{ fontSize: 12, background: '#eee', padding: '2px 6px', borderRadius: 4 }}>
                  状态: {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}