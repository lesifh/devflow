import { useEffect, useState, type FormEvent } from 'react'
import { getWorkItem, updateWorkItem, deleteWorkItem } from '../api/items'
import type { WorkItem, WorkItemPriority } from '../types'

interface Props {
  itemId: number
  onClose: () => void
  onRefresh: () => void
}

export default function ItemModal({ itemId, onClose, onRefresh }: Props) {
  const [item, setItem] = useState<WorkItem | null>(null)
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<WorkItemPriority>('medium')

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkItem(itemId)
        setItem(data)
        setTitle(data.title)
        setDescription(data.description || '')
        setPriority(data.priority)
      } catch (err) {
        alert('获取详情失败')
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    try {
      await updateWorkItem(itemId, { title, description, priority })
      onRefresh()
      onClose()
    } catch (err) {
      alert('保存失败')
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个工作项吗？')) return
    try {
      await deleteWorkItem(itemId)
      onRefresh()
      onClose()
    } catch (err) {
      alert('删除失败')
    }
  }

  if (loading || !item) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>工作项详情</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="low">低 (Low)</option>
              <option value="medium">中 (Medium)</option>
              <option value="high">高 (High)</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: 8, boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={handleDelete} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              删除
            </button>
            <div>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', marginRight: 10 }}>取消</button>
              <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                保存修改
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}