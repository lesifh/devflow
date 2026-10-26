import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject } from '../api/projects'
import { useAuth } from '../store/auth'
import type { Project } from '../types'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  // 页面加载时获取项目列表
  async function loadProjects() {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      console.error('获取项目失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // 新建项目
  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createProject({ name })
      setName('')
      loadProjects()   // 重新拉取列表
    } catch (err) {
      alert('创建失败')
    }
  }

  // 退出登录
  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      {/* 顶部导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
        <h2>我的项目</h2>
        <div>
          欢迎，{user?.username} {' '}
          <button onClick={handleLogout} style={{ padding: '4px 8px' }}>退出</button>
        </div>
      </div>

      {/* 新建项目表单 */}
      <form onSubmit={handleCreate} style={{ marginBottom: 30 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入新项目名称..."
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>创建项目</button>
      </form>

      {/* 项目列表 */}
      {loading ? (
        <p>加载中...</p>
      ) : projects.length === 0 ? (
        <p>还没有项目，创建一个吧！</p>
      ) : (
        <div>
          {projects.map((p) => (
            <div 
              key={p.id} 
              onClick={() => navigate(`/projects/${p.id}`)}
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
              <h3>{p.name}</h3>
              <p style={{ color: '#666' }}>{p.description || '无描述'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}