import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Card, Typography, Tag, Button, message, Empty, Space, Tabs } from 'antd'
import { LogoutOutlined, ArrowRightOutlined, CheckOutlined, LeftOutlined } from '@ant-design/icons'
import { getMyTasks, updateWorkItem } from '../api/items'
import { useAuth } from '../store/auth'
import type { WorkItem, WorkItemStatus } from '../types'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography

export default function MyTasks() {
  const [tasks, setTasks] = useState<WorkItem[]>([])
  const navigate = useNavigate()
  
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  async function load() {
    try {
      const data = await getMyTasks()
      setTasks(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleStatusChange(itemId: number, newStatus: string) {
    try {
      // 👈 强制类型转换
      await updateWorkItem(itemId, { status: newStatus as WorkItemStatus })
      message.success('状态更新成功')
      load()
    } catch (err) {
      message.error('更新失败')
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const doingTasks = tasks.filter(t => t.status === 'doing')
  const reviewTasks = tasks.filter(t => t.status === 'review')

  const renderTaskList = (list: WorkItem[], type: 'todo'|'doing'|'review') => {
    if (list.length === 0) return <Empty description="暂无任务" style={{ marginTop: 60 }} />
    return list.map(t => (
      <Card 
        key={t.id} 
        style={{ 
          marginBottom: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderLeft: t.type === 'bug' ? '4px solid #ff4d4f' : t.type === 'story' ? '4px solid #1890ff' : '4px solid #52c41a' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 12 }}>
              <Tag color="blue">{t.project_name || '未知项目'}</Tag>
              <Tag>{t.type.toUpperCase()}</Tag>
              <Tag color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'green'}>
                {t.priority === 'high' ? '高优先级' : t.priority === 'medium' ? '中优先级' : '低优先级'}
              </Tag>
            </Space>
            <Title level={5} style={{ margin: 0 }}>{t.title}</Title>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>{t.description || '无描述'}</Paragraph>
          </div>
          <div style={{ marginLeft: 24 }}>
            {type === 'todo' && (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => handleStatusChange(t.id, 'doing')}>
                开始开发
              </Button>
            )}
            {type === 'doing' && (
              <Button type="primary" ghost icon={<CheckOutlined />} onClick={() => handleStatusChange(t.id, 'review')}>
                提交审核
              </Button>
            )}
            {type === 'review' && (
              <Tag color="processing" style={{ padding: '6px 12px', fontSize: 14 }}>等待验收</Tag>
            )}
          </div>
        </div>
      </Card>
    ))
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <Space size="large">
          <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/projects')} />
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4f46e5' }}>DevFlow 开发者工作台</div>
        </Space>
        <Space>
          <Text>当前用户：{user?.username}</Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }}>退出</Button>
        </Space>
      </Header>

      <Content style={{ padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <Tabs 
          defaultActiveKey="doing" 
          size="large"
          items={[
            {
              key: 'todo',
              label: `待办 (${todoTasks.length})`,
              children: renderTaskList(todoTasks, 'todo'),
            },
            {
              key: 'doing',
              label: `开发中 (${doingTasks.length})`,
              children: renderTaskList(doingTasks, 'doing'),
            },
            {
              key: 'review',
              label: `审核中 (${reviewTasks.length})`,
              children: renderTaskList(reviewTasks, 'review'),
            },
          ]}
        />
      </Content>
    </Layout>
  )
}