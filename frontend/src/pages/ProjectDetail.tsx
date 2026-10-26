import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Button, Input, Typography, message, Space, Card, List, Tag, Empty } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons'
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gap: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
        <Title level={4} style={{ margin: 0 }}>{project?.name || '加载中...'}</Title>
      </Header>

      {/* 放大了 maxWidth，让页面更宽 */}
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
                  style={{ borderRadius: 8, borderLeft: '4px solid #4f46e5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <Card.Meta 
                    title={<span style={{ fontSize: 18 }}>{item.name}</span>}
                    description={
                      <div style={{ marginTop: 12 }}>
                        <Paragraph ellipsis={{ rows: 2 }}>{item.goal || '无具体目标'}</Paragraph>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                          <Tag color={
                            item.status === 'active' ? 'processing' : 
                            item.status === 'closed' ? 'default' : 'warning'
                          }>
                            {item.status === 'planning' ? '计划中' : item.status === 'active' ? '进行中' : '已关闭'}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            进入看板 →
                          </Text>
                        </div>
                      </div>
                    } 
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Content>
    </Layout>
  )
}