import { useEffect, useState, type FormEvent, type DragEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBoard, createWorkItem, updateWorkItem } from '../api/items'
import type { Board as BoardType } from '../types'
import ItemModal from '../components/ItemModal'

export default function Board() {
  const { id, sprintId } = useParams()
  const projectId = Number(id)
  const sprintIdNum = Number(sprintId)
  const navigate = useNavigate()

  const [board, setBoard] = useState<BoardType>({ todo: [], doing: [], review: [], done: [] })
  const [loading, setLoading] = useState(true)
  
  const [title, setTitle] = useState('')
  const [type, setType] = useState('task')

  // 控制弹窗的状态
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  async function loadBoard() {
    try {
      const data = await getBoard(projectId, sprintIdNum)
      setBoard(data)
    } catch (err) {
      console.error('获取看板失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoard()
  }, [projectId, sprintIdNum])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createWorkItem(projectId, {
        title,
        type,
        sprint_id: sprintIdNum,
      })
      setTitle('')
      loadBoard()
    } catch (err) {
      alert('创建失败')
    }
  }

  // 1. 开始拖拽
  function handleDragStart(e: DragEvent, itemId: number) {
    e.dataTransfer.setData('itemId', itemId.toString())
    ;(e.currentTarget as HTMLDivElement).style.opacity = '0.4'
  }

  // 2. 结束拖拽
  function handleDragEnd(e: DragEvent) {
    ;(e.currentTarget as HTMLDivElement).style.opacity = '1'
  }

  // 3. 拖到目标列放下
  async function handleDrop(e: DragEvent, newStatus: string) {
    e.preventDefault()
    const itemIdStr = e.dataTransfer.getData('itemId')
    if (!itemIdStr) return
    const itemId = Number(itemIdStr)

    setBoard((prev) => {
      let movedItem: any = null
      const newBoard = {
        todo: prev.todo.filter((i) => {
          if (i.id === itemId) { movedItem = i; return false }
          return true
        }),
        doing: prev.doing.filter((i) => {
          if (i.id === itemId) { movedItem = i; return false }
          return true
        }),
        review: prev.review.filter((i) => {
          if (i.id === itemId) { movedItem = i; return false }
          return true
        }),
        done: prev.done.filter((i) => {
          if (i.id === itemId) { movedItem = i; return false }
          return true
        }),
      }

      if (movedItem) {
        movedItem.status = newStatus as any
        newBoard[newStatus as keyof typeof newBoard].push(movedItem)
      }
      return newBoard
    })

    try {
      await updateWorkItem(itemId, { status: newStatus })
    } catch (err) {
      alert('更新失败，请刷新页面')
      loadBoard()
    }
  }

  const columns = [
    { key: 'todo', label: '待办 (To Do)' },
    { key: 'doing', label: '进行中 (Doing)' },
    { key: 'review', label: '待验证 (Review)' },
    { key: 'done', label: '已完成 (Done)' },
  ] as const

  return (
    <div style={{ padding: 24, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航 */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate(`/projects/${projectId}`)}>← 返回迭代列表</button>
        <h1 style={{ display: 'inline-block', marginLeft: 20 }}>看板 (迭代 ID: {sprintIdNum})</h1>
      </div>

      {/* 新建工作项表单 */}
      <form onSubmit={handleCreate} style={{ marginBottom: 30, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入需求/任务/缺陷标题..."
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 8, marginRight: 10 }}>
          <option value="story">需求 (Story)</option>
          <option value="task">任务 (Task)</option>
          <option value="bug">缺陷 (Bug)</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>添加工作项</button>
      </form>

      {/* 看板主体 */}
      {loading ? (
        <p>加载中...</p>
      ) : (
        <div style={{ display: 'flex', gap: 16, flex: 1, overflowX: 'auto' }}>
          {columns.map((col) => (
            <div 
              key={col.key} 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, col.key)}
              style={{ 
                flex: 1, minWidth: 250, background: '#f0f2f5', borderRadius: 8, padding: 12,
                display: 'flex', flexDirection: 'column'
              }}
            >
              <h3 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
                {col.label} ({board[col.key].length})
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {board[col.key].map((item) => (
                  <div 
                    key={item.id} 
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItemId(item.id)} // 👈 点击打开弹窗
                    style={{
                      background: '#fff', padding: 12, marginBottom: 8, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      borderLeft: item.type === 'bug' ? '4px solid #ef4444' : 
                                 item.type === 'story' ? '4px solid #3b82f6' : '4px solid #10b981'
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
                      {item.type}
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 渲染弹窗 */}
      {selectedItemId !== null && (
        <ItemModal 
          itemId={selectedItemId} 
          onClose={() => setSelectedItemId(null)} 
          onRefresh={loadBoard} 
        />
      )}
    </div>
  )
}