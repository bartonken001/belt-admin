import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Popconfirm } from 'antd'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import api from '../api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function Marketing() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchPromotions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/marketing')
      setPromotions(res.data || [])
    } catch (err) {
      message.error('获取促销活动失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/marketing/${id}`)
      message.success('促销已删除')
      fetchPromotions()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        startsAt: values.dates?.[0].toISOString(),
        endsAt: values.dates?.[1].toISOString()
      }
      delete data.dates

      if (editing) {
        await api.put(`/marketing/${editing.id}`, data)
        message.success('促销已更新')
      } else {
        await api.post('/marketing', data)
        message.success('促销已创建')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      fetchPromotions()
    } catch (err: any) {
      message.error(err.response?.data?.error || '保存失败')
    }
  }

  const openEdit = (promo: any) => {
    setEditing(promo)
    form.setFieldsValue({
      ...promo,
      dates: [dayjs(promo.startsAt), dayjs(promo.endsAt)]
    })
    setModalOpen(true)
  }

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '优惠码', dataIndex: 'code' },
    { title: '类型', dataIndex: 'type' },
    { title: '优惠值', dataIndex: 'value', render: (v: number, r: any) => r.type === 'percentage' ? `${v}%` : `$${v}` },
    { title: '已使用/限制', render: (_: any, r: any) => `${r.usageCount}/${r.usageLimit || '∞'}` },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (active: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {active ? '生效中' : '已失效'}
        </span>
      )
    },
    { title: '结束日期', dataIndex: 'endsAt', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: '操作',
      render: (_: any, record: any) => (
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
        <h1 className="text-2xl font-bold text-gray-900">营销管理</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
          添加促销
        </Button>
      </div>

      <Table columns={columns} dataSource={promotions} rowKey="id" loading={loading} />

      <Modal title={editing ? '编辑促销' : '新建促销'} open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="优惠码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={[
                { value: 'percentage', label: '百分比' },
                { value: 'fixed', label: '固定金额' }
              ]} />
            </Form.Item>
            <Form.Item name="value" label="优惠值" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <Form.Item name="dates" label="有效期" rules={[{ required: true }]}>
            <RangePicker className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="minPurchase" label="最低消费">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="maxDiscount" label="最大优惠">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
          </div>
          <Form.Item name="usageLimit" label="使用次数限制">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <label className="flex items-center gap-2"><input type="checkbox" /> 启用</label>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit">{editing ? '更新' : '创建'}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}