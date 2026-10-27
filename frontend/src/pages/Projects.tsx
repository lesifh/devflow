import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Button, Input, List, Typography, message, Space, Card, Dropdown, Modal, Form, Switch, Tag } from 'antd'
import { PlusOutlined, LogoutOutlined, ProjectOutlined, MoreOutlined, DeleteOutlined, InboxOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons'
import { getProjects, createProject, deleteProject, archiveProject } from '../api/projects'
import { useAuth } from '../store/auth'
import type { Project } from '../types'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  async function loadProjects() {
    setLoading(true)
    try {
      const data = await getProjects(showArchived)
      setProjects(data)
    } catch (err) {
      message.error('获取项目失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [showArchived])

  async function handleCreate(values: any) {
    setCreating(true)
    try {
      await createProject({ name: values.name, description: values.description })
      message.success('项目创建成功')
      setIsModalOpen(false)
      form.resetFields()
      loadProjects()
    } catch (err) {
      message.error('创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleArchive = async (e: React.MouseEvent, projectId: number, currentStatus: boolean) => {
    e.stopPropagation()
    try {
      await archiveProject(projectId, !currentStatus)
      message.success(!currentStatus ? '项目已归档' : '项目已恢复')
      loadProjects()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleDelete = (e: React.MouseEvent, projectId: number, projectName: string) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认彻底删除？',
      content: `您确定要永久删除「${projectName}」吗？此操作不可恢复！`,
      okText: '彻底删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProject(projectId)
          message.success('项目已删除')
          loadProjects()
        } catch (err) {
          message.error('删除失败')
        }
      },
    })
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4f46e5' }}>DevFlow</div>
        <Space>
          <Button type="primary" ghost icon={<UserOutlined />} onClick={() => navigate('/my-tasks')}>
            我的工作台
          </Button>
          <Text>欢迎，{user?.username}</Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }}>
            退出
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <Space size="large">
            <Title level={3} style={{ margin: 0 }}>{showArchived ? '已归档项目' : '我的项目'}</Title>
            <Space>
              <Switch checked={showArchived} onChange={setShowArchived} />
              <span style={{ color: '#8c8c8c' }}>查看归档</span>
            </Space>
          </Space>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建项目
          </Button>
        </div>

        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={projects}
          loading={loading}
          locale={{ emptyText: showArchived ? '暂无归档项目' : '暂无活跃项目' }}
          renderItem={(item) => (
            <List.Item>
              <Card 
                hoverable 
                onClick={() => navigate(`/projects/${item.id}`)}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: item.is_archived ? 0.8 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Card.Meta 
                    avatar={<ProjectOutlined style={{ fontSize: 24, color: item.is_archived ? '#bfbfbf' : '#4f46e5', marginTop: 4 }} />}
                    title={
                      <Space>
                        {item.name}
                        {item.is_archived && <Tag color="default">已归档</Tag>}
                      </Space>
                    } 
                    description={<div style={{ height: 44, overflow: 'hidden' }}>{item.description || '暂无描述'}</div>} 
                    style={{ flex: 1 }}
                  />
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'archive',
                          label: item.is_archived ? '恢复项目' : '归档项目',
                          icon: item.is_archived ? <InboxOutlined /> : <CheckCircleOutlined />,
                          onClick: (e) => handleArchive(e.domEvent as React.MouseEvent, item.id, item.is_archived),
                        },
                        { type: 'divider' },
                        {
                          key: 'delete',
                          label: '彻底删除',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: (e) => handleDelete(e.domEvent as React.MouseEvent, item.id, item.name),
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                  </Dropdown>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Content>

      <Modal
        title="新建项目"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 24 }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input size="large" placeholder="例如：校园二手交易系统" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea size="large" rows={4} placeholder="简单介绍一下这个项目..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={creating}>创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}