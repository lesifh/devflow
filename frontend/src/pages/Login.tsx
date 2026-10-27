import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../api/auth'
import { useAuth } from '../store/auth'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuth((s) => s.setAuth)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const data = await login(values.username, values.password)
      setAuth(data.access_token, data.user)
      message.success('登录成功')
      navigate('/projects')
    } catch (err: any) {
      message.error(err.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#4f46e5', marginBottom: 8 }}>DevFlow</Title>
          <Text type="secondary">敏捷项目管理系统</Text>
        </div>

        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 14 }}>
          <Text type="secondary">还没有账号？</Text>
          <Link to="/register" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500, marginLeft: 4 }}>
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  )
}