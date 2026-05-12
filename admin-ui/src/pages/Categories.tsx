import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import api from '../api'
import type { Category } from '../types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories')
      setCategories(res.data || [])
    } catch (err) {
      message.error('获取分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`)
      message.success('分类已删除')
      fetchCategories()
    } catch (err: any) {
      message.error(err.response?.data?.error || '删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, values)
        message.success('分类已更新')
      } else {
        await api.post('/categories', values)
        message.success('分类已创建')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      fetchCategories()
    } catch (err: any) {
      message.error(err.response?.data?.error || '保存失败')
    }
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    form.setFieldsValue(cat)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '别名', dataIndex: 'slug' },
    { title: '描述', dataIndex: 'description' },
    { title: '排序', dataIndex: 'sortOrder' },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (active: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {active ? '启用' : '禁用'}
        </span>
      )
    },
    {
      title: '操作',
      render: (_: any, record: Category) => (
        <div className="flex gap-2">
          <Button size="small" icon={<Edit2 size={14} />} onClick={() => openEdit(record)} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
          添加分类
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editing ? '编辑分类' : '新建分类'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true, sortOrder: 0 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="别名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 启用
            </label>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editing ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}