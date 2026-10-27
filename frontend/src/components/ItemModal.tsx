import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Button, Space, message } from 'antd'
import { getWorkItem, updateWorkItem, deleteWorkItem } from '../api/items'
import { getUsers } from '../api/auth'
import type { WorkItem, User } from '../types'

const { TextArea } = Input

interface Props {
  itemId: number
  onClose: () => void
  onRefresh: () => void
}

export default function ItemModal({ itemId, onClose, onRefresh }: Props) {
  const [item, setItem] = useState<WorkItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [data, u] = await Promise.all([
          getWorkItem(itemId),
          getUsers()
        ])
        setItem(data)
        setUsers(u)
        
        // 👈 强制绑定，如果 data.assignee_id 是 null，也会被正确设置为空
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          assignee_id: data.assignee_id || undefined 
        })
      } catch (err) {
        message.error('获取详情失败')
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId, form, onClose])

  async function handleSave(values: any) {
    setSaving(true)
    try {
      await updateWorkItem(itemId, {
        ...values,
        assignee_id: values.assignee_id || null 
      })
      message.success('保存成功')
      onRefresh()
      onClose()
    } catch (err) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteWorkItem(itemId)
          message.success('已删除')
          onRefresh()
          onClose()
        } catch (err) {
          message.error('删除失败')
        }
      }
    })
  }

  if (loading || !item) return null

  return (
    <Modal
      title="工作项详情"
      open={true}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 20 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="status" label="状态" style={{ flex: 1 }}>
            <Select size="large">
              <Select.Option value="todo">待办 (To Do)</Select.Option>
              <Select.Option value="doing">进行中 (Doing)</Select.Option>
              <Select.Option value="review">待验证 (Review)</Select.Option>
              <Select.Option value="done">已完成 (Done)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="priority" label="优先级" style={{ flex: 1 }}>
            <Select size="large">
              <Select.Option value="low">低 (Low)</Select.Option>
              <Select.Option value="medium">中 (Medium)</Select.Option>
              <Select.Option value="high">高 (High)</Select.Option>
            </Select>
          </Form.Item>

          {/* 👈 指派给 */}
          <Form.Item name="assignee_id" label="指派给" style={{ flex: 1 }}>
            <Select size="large" allowClear placeholder="未指派">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="description" label="描述">
          <TextArea rows={5} placeholder="补充详细描述..." />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button danger type="text" onClick={handleDelete}>删除工作项</Button>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}