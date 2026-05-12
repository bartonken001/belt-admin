import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Tag, Timeline, InputNumber } from 'antd'
import { Eye, Truck, CheckCircle } from 'lucide-react'
import api from '../api'
import type { Order } from '../types'

const statusColors: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red'
}

const statusText: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已完成',
  cancelled: '已取消'
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [shipForm] = Form.useForm()
  const [page, setPage] = useState(1)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      setOrders(res.data || [])
    } catch (err) {
      message.error('获取订单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page])

  const openDetail = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}`, { status })
      message.success('状态已更新')
      fetchOrders()
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch (err) {
      message.error('更新失败')
    }
  }

  const handleShip = async (values: any) => {
    if (!selectedOrder) return
    try {
      await api.post(`/orders/${selectedOrder.id}/ship`, values)
      message.success('物流信息已添加')
      setDetailOpen(false)
      shipForm.resetFields()
      fetchOrders()
    } catch (err) {
      message.error('添加失败')
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNumber' },
    { title: '客户', dataIndex: 'name' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '金额', dataIndex: 'total', render: (t: number) => `$${t?.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{statusText[s] || s}</Tag>
    },
    {
      title: '支付',
      dataIndex: 'paymentStatus',
      render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'orange'}>{s === 'paid' ? '已支付' : '待支付'}</Tag>
    },
    { title: '日期', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: '操作',
      render: (_: any, record: Order) => (
        <Button size="small" icon={<Eye size={14} />} onClick={() => openDetail(record)}>
          查看
        </Button>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, onChange: setPage, pageSize: 20 }}
      />

      <Modal
        title={`订单 ${selectedOrder?.orderNumber}`}
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setSelectedOrder(null); }}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">客户信息</h3>
                <p>{selectedOrder.name}</p>
                <p>{selectedOrder.email}</p>
                <p>{selectedOrder.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">收货地址</h3>
                <p className="whitespace-pre-line">{selectedOrder.shippingAddress}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">订单状态</h3>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                  <Button
                    key={s}
                    type={selectedOrder.status === s ? 'primary' : 'default'}
                    onClick={() => updateStatus(selectedOrder.id, s)}
                  >
                    {statusText[s]}
                  </Button>
                ))}
              </div>
            </div>

            <Form form={shipForm} layout="vertical" onFinish={handleShip} className="mb-6">
              <h3 className="font-semibold mb-2">添加物流</h3>
              <div className="flex gap-2">
                <Form.Item name="carrier" className="flex-1" rules={[{ required: true }]}>
                  <Input placeholder="物流公司 (如: 顺丰, EMS)" />
                </Form.Item>
                <Form.Item name="trackingNumber" className="flex-1" rules={[{ required: true }]}>
                  <Input placeholder="物流单号" />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<Truck size={14} />}>
                  发货
                </Button>
              </div>
            </Form>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">订单明细</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>商品金额:</span><span>${selectedOrder.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>运费:</span><span>${selectedOrder.shippingCost?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>税费:</span><span>${selectedOrder.tax?.toFixed(2)}</span></div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>优惠:</span><span>-${selectedOrder.discount?.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold border-t pt-1"><span>总计:</span><span>${selectedOrder.total?.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}