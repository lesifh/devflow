import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Button, Input, List, Typography, message, Space, Card, Dropdown, Modal, Form } from 'antd'
import { PlusOutlined, LogoutOutlined, ProjectOutlined, MoreOutlined, DeleteOutlined } from '@ant-design/icons'
import { getProjects, createProject, deleteProject } from '../api/projects'
import { useAuth } from '../store/auth'
import type { Project } from '../types'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  // 控制新建弹窗的状态
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  async function loadProjects() {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      message.error('获取项目失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // 提交新建项目表单
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

  const handleDelete = (e: React.MouseEvent, projectId: number, projectName: string) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除项目？',
      content: `您确定要删除「${projectName}」吗？该项目下的所有迭代和任务都将被清空，且无法恢复！`,
      okText: '确认删除',
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
          <Text>欢迎，{user?.username}</Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }}>
            退出
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>我的项目</Title>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建项目
          </Button>
        </div>

        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={projects}
          loading={loading}
          renderItem={(item) => (
            <List.Item>
              <Card 
                hoverable 
                onClick={() => navigate(`/projects/${item.id}`)}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Card.Meta 
                    avatar={<ProjectOutlined style={{ fontSize: 24, color: '#4f46e5', marginTop: 4 }} />}
                    title={item.name} 
                    description={<div style={{ height: 44, overflow: 'hidden' }}>{item.description || '暂无描述'}</div>} 
                    style={{ flex: 1 }}
                  />
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'delete',
                          label: '删除项目',
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

      {/* 新建项目弹窗 */}
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