import { useEffect, useState, type DragEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Button, Input, Select, message, Typography, Space, Tag, Empty } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { getBoard, createWorkItem, updateWorkItem } from '../api/items'
import { getUsers } from '../api/auth'
import ItemModal from '../components/ItemModal'
import type { Board as BoardType, User } from '../types'

const { Header, Content } = Layout
const { Title } = Typography

export default function Board() {
  const { id, sprintId } = useParams()
  const projectId = Number(id)
  const sprintIdNum = Number(sprintId)
  const navigate = useNavigate()

  const [board, setBoard] = useState<BoardType>({ todo: [], doing: [], review: [], done: [] })
  const [loading, setLoading] = useState(true)
  
  const [title, setTitle] = useState('')
  const [type, setType] = useState('task')
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  async function loadBoard() {
    try {
      const data = await getBoard(projectId, sprintIdNum)
      setBoard(data)
    } catch (err) {
      message.error('获取看板失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoard()
    getUsers().then(setUsers).catch(console.error)
  }, [projectId, sprintIdNum])

  async function handleCreate() {
    if (!title.trim()) return
    try {
      await createWorkItem(projectId, { 
        title, type, sprint_id: sprintIdNum, assignee_id: assigneeId 
      })
      setTitle('')
      setAssigneeId(undefined)
      message.success('添加成功')
      loadBoard()
    } catch (err) {
      message.error('创建失败')
    }
  }

  function handleDragStart(e: DragEvent, itemId: number) {
    e.dataTransfer.setData('itemId', itemId.toString())
    ;(e.currentTarget as HTMLDivElement).style.opacity = '0.4'
  }

  function handleDragEnd(e: DragEvent) {
    ;(e.currentTarget as HTMLDivElement).style.opacity = '1'
  }

  async function handleDrop(e: DragEvent, newStatus: string) {
    e.preventDefault()
    const itemIdStr = e.dataTransfer.getData('itemId')
    if (!itemIdStr) return
    const itemId = Number(itemIdStr)

    setBoard((prev) => {
      let movedItem: any = null
      const newBoard = {
        todo: prev.todo.filter((i) => { if (i.id === itemId) { movedItem = i; return false } return true }),
        doing: prev.doing.filter((i) => { if (i.id === itemId) { movedItem = i; return false } return true }),
        review: prev.review.filter((i) => { if (i.id === itemId) { movedItem = i; return false } return true }),
        done: prev.done.filter((i) => { if (i.id === itemId) { movedItem = i; return false } return true }),
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
      message.error('更新失败，请刷新')
      loadBoard()
    }
  }

  const columns = [
    { key: 'todo', label: '待办 (To Do)', color: '#8c8c8c' },
    { key: 'doing', label: '进行中 (Doing)', color: '#1890ff' },
    { key: 'review', label: '待验证 (Review)', color: '#faad14' },
    { key: 'done', label: '已完成 (Done)', color: '#52c41a' },
  ] as const

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gap: 16, flexShrink: 0 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${projectId}`)} />
        <Title level={4} style={{ margin: 0 }}>项目看板</Title>
      </Header>

      <Content style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Space style={{ marginBottom: 24, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <Input 
            placeholder="输入需求、任务或缺陷..." 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            onPressEnter={handleCreate}
            style={{ width: 300, height: 40 }}
          />
          <Select value={type} onChange={setType} style={{ width: 120, height: 40 }}>
            <Select.Option value="story">需求 (Story)</Select.Option>
            <Select.Option value="task">任务 (Task)</Select.Option>
            <Select.Option value="bug">缺陷 (Bug)</Select.Option>
          </Select>
          <Select 
            placeholder="指派给..." 
            value={assigneeId} 
            onChange={setAssigneeId} 
            allowClear
            style={{ width: 140, height: 40 }}
          >
            {users.map(u => (
              <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ height: 40 }}>
            添加
          </Button>
        </Space>

        <div style={{ display: 'flex', gap: 24, flex: 1, overflowX: 'auto', alignItems: 'stretch' }}>
          {columns.map((col) => (
            <div 
              key={col.key} 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, col.key)}
              style={{ 
                flex: 1, minWidth: 300, background: '#fafafa', borderRadius: 12, padding: 16, 
                display: 'flex', flexDirection: 'column', border: '1px solid #f0f0f0', overflowY: 'hidden' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontWeight: 600, fontSize: 16, color: '#262626', flexShrink: 0 }}>
                <span>{col.label}</span>
                <Tag color={col.color} style={{ borderRadius: 10, fontWeight: 'bold' }}>{board[col.key].length}</Tag>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 150 }}>
                {board[col.key].length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无任务" style={{ marginTop: 40 }} />
                ) : (
                  board[col.key].map((item) => (
                    <div 
                      key={item.id} 
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedItemId(item.id)}
                      style={{
                        background: '#fff', padding: 20, marginBottom: 16, borderRadius: 8,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.06)', cursor: 'pointer',
                        borderLeft: item.type === 'bug' ? '4px solid #ff4d4f' : 
                                   item.type === 'story' ? '4px solid #1890ff' : '4px solid #52c41a'
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{item.type.toUpperCase()}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: '#141414', fontSize: 16, lineHeight: 1.5, marginBottom: 12 }}>
                        {item.title}
                      </div>
                      
                      {item.assignee_name && (
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#8c8c8c' }}>
                          <div style={{ 
                            width: 20, height: 20, borderRadius: '50%', background: '#e6f4ff', color: '#1677ff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, fontSize: 12, fontWeight: 'bold'
                          }}>
                            {item.assignee_name.charAt(0).toUpperCase()}
                          </div>
                          {item.assignee_name}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Content>

      {selectedItemId !== null && (
        <ItemModal 
          itemId={selectedItemId} 
          onClose={() => setSelectedItemId(null)} 
          onRefresh={loadBoard} 
        />
      )}
    </Layout>
  )
}