import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Button, Input, Typography, message, Space, Card, List, Tag, Empty, Dropdown } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, MoreOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import { getSprints, createSprint } from '../api/sprints'
import client from '../api/client'
import type { Sprint, Project } from '../types'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography

export default function ProjectDetail() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()
  
  const [project, setProject] = useState<Project | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function loadProject() {
    try {
      const res = await client.get<Project>(`/projects/${projectId}`)
      setProject(res.data)
    } catch (err) {
      message.error('项目不存在或无权访问')
      navigate('/projects')
    }
  }

  async function loadSprints() {
    try {
      const data = await getSprints(projectId)
      setSprints(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
    loadSprints()
  }, [projectId])

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      await createSprint(projectId, { name })
      setName('')
      message.success('新建迭代成功')
      loadSprints()
    } catch (err) {
      message.error('创建迭代失败')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateStatus(e: React.MouseEvent, sprintId: number, newStatus: string) {
    e.stopPropagation()
    try {
      await client.put(`/sprints/${sprintId}`, { status: newStatus })
      message.success('迭代状态已更新')
      loadSprints()
    } catch (err) {
      message.error('更新状态失败')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gap: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
        <Title level={4} style={{ margin: 0 }}>{project?.name || '加载中...'}</Title>
      </Header>

      <Content style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {project && (
          <Card style={{ marginBottom: 32, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
              {project.description || '暂无项目描述'}
            </Paragraph>
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>迭代列表 (Sprints)</Title>
          <Space>
            <Input 
              placeholder="例如：Sprint 1" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              onPressEnter={handleCreate}
              style={{ width: 250, height: 40 }} 
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={creating} style={{ height: 40 }}>
              新建迭代
            </Button>
          </Space>
        </div>

        {sprints.length === 0 && !loading ? (
          <Empty description="还没有迭代，先建一个吧！" style={{ marginTop: 60 }} />
        ) : (
          <List
            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={sprints}
            loading={loading}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  hoverable 
                  onClick={() => navigate(`/projects/${projectId}/sprints/${item.id}`)}
                  style={{ 
                    borderRadius: 8, 
                    borderLeft: item.status === 'active' ? '4px solid #52c41a' : '4px solid #d9d9d9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    opacity: item.status === 'closed' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Card.Meta 
                      title={<span style={{ fontSize: 18 }}>{item.name}</span>}
                      style={{ flex: 1 }}
                    />
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'active',
                            label: '重新开启',
                            icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
                            disabled: item.status === 'active',
                            onClick: (e) => handleUpdateStatus(e.domEvent as React.MouseEvent, item.id, 'active'),
                          },
                          {
                            key: 'closed',
                            label: '结束迭代',
                            icon: <StopOutlined style={{ color: '#ff4d4f' }} />,
                            disabled: item.status === 'closed',
                            onClick: (e) => handleUpdateStatus(e.domEvent as React.MouseEvent, item.id, 'closed'),
                          },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
                    </Dropdown>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <Paragraph ellipsis={{ rows: 2 }}>{item.goal || '无具体目标'}</Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                      <Tag color={item.status === 'active' ? 'success' : 'default'}>
                        {item.status === 'active' ? '进行中' : '已结束'}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        进入看板 →
                      </Text>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Content>
    </Layout>
  )
}