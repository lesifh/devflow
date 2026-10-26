import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks } from '../api/items'
import type { WorkItem } from '../types'
import ItemModal from '../components/ItemModal' // 👈 重新引入弹窗

export default function MyTasks() {
  const [tasks, setTasks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null) // 👈 弹窗控制
  const navigate = useNavigate()

  async function load() {
    try {
      const data = await getMyTasks()
      setTasks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>分配给我的任务</h1>
        <button onClick={() => navigate('/projects')} style={{ padding: '4px 12px' }}>返回项目列表</button>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : tasks.length === 0 ? (
        <p>太棒了，没有分配给您的任务！</p>
      ) : (
        <div>
          {tasks.map(t => (
            <div 
              key={t.id} 
              onClick={() => setSelectedItemId(t.id)} // 👈 关键：点击卡片打开弹窗
              style={{ 
                border: '1px solid #ccc', padding: 16, marginBottom: 10, borderRadius: 6, cursor: 'pointer',
                borderLeft: t.type === 'bug' ? '4px solid #ef4444' : t.type === 'story' ? '4px solid #3b82f6' : '4px solid #10b981'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>{t.type}</span>
                <span style={{ fontSize: 12, background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{t.status}</span>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{t.title}</h3>
              <p style={{ color: '#666', fontSize: 14 }}>{t.description || '无描述'}</p>
              <div style={{ fontSize: 12, color: '#999' }}>
                项目: {t.project_name} | 优先级: {t.priority}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 👈 渲染弹窗 */}
      {selectedItemId !== null && (
        <ItemModal 
          itemId={selectedItemId} 
          onClose={() => setSelectedItemId(null)} 
          onRefresh={load} 
        />
      )}
    </div>
  )
}