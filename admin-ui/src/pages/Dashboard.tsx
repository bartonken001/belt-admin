import { useState, useEffect } from 'react'
import api from '../api'
import { Card, Statistic } from 'antd'
import { ShoppingCart, Users, Package, DollarSign, MessageSquare, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

const { Meta } = Card

export default function Dashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    products: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, customers, products] = await Promise.all([
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/customers').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: { total: 0 } }))
        ])

        const ordersData = orders.data
        const totalRevenue = Array.isArray(ordersData)
          ? ordersData.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
          : 0

        setStats({
          orders: Array.isArray(ordersData) ? ordersData.length : 0,
          customers: Array.isArray(customers.data) ? customers.data.length : 0,
          products: products.data.total || 0,
          revenue: totalRevenue
        })
      } catch (err) {
        console.error('获取数据失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const menuItems = [
    { title: '商品管理', icon: <Package size={32} />, link: '/products', color: 'bg-blue-500' },
    { title: '订单管理', icon: <ShoppingCart size={32} />, link: '/orders', color: 'bg-green-500' },
    { title: '客户管理', icon: <Users size={32} />, link: '/customers', color: 'bg-purple-500' },
    { title: '财务管理', icon: <DollarSign size={32} />, link: '/finance', color: 'bg-yellow-500' },
    { title: '客服聊天', icon: <MessageSquare size={32} />, link: '/chat', color: 'bg-pink-500' },
    { title: '网站设置', icon: <Settings size={32} />, link: '/settings', color: 'bg-gray-500' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">控制台</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card loading={loading} className="shadow-sm">
          <Statistic title="订单总数" value={stats.orders} prefix={<ShoppingCart className="inline mr-2 text-blue-500" />} />
        </Card>
        <Card loading={loading} className="shadow-sm">
          <Statistic title="客户总数" value={stats.customers} prefix={<Users className="inline mr-2 text-purple-500" />} />
        </Card>
        <Card loading={loading} className="shadow-sm">
          <Statistic title="商品总数" value={stats.products} prefix={<Package className="inline mr-2 text-green-500" />} />
        </Card>
        <Card loading={loading} className="shadow-sm">
          <Statistic title="总收入" value={stats.revenue} precision={2} prefix="$" />
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {menuItems.map(item => (
          <Link key={item.link} to={item.link}>
            <Card hoverable className="text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${item.color} text-white mb-3`}>
                {item.icon}
              </div>
              <Meta title={item.title} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}