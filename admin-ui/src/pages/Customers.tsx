import { useState, useEffect } from 'react'
import { Table, message } from 'antd'
import api from '../api'
import type { Customer } from '../types'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/customers')
      setCustomers(res.data || [])
    } catch (err) {
      message.error('获取客户失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page])

  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '电话', dataIndex: 'phone' },
    { title: '订单数', dataIndex: 'orderCount' },
    { title: '消费总额', dataIndex: 'totalSpent', render: (t: number) => `$${t?.toFixed(2)}` },
    { title: '注册时间', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, onChange: setPage, pageSize: 20 }}
      />
    </div>
  )
}