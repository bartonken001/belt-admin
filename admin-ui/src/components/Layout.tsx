import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Tag
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: '控制台' },
  { path: '/products', icon: <Package size={20} />, label: '商品' },
  { path: '/categories', icon: <Package size={20} />, label: '分类' },
  { path: '/orders', icon: <ShoppingCart size={20} />, label: '订单' },
  { path: '/customers', icon: <Users size={20} />, label: '客户' },
  { path: '/finance', icon: <DollarSign size={20} />, label: '财务' },
  { path: '/chat', icon: <MessageSquare size={20} />, label: '客服' },
  { path: '/marketing', icon: <Tag size={20} />, label: '营销' },
  { path: '/settings', icon: <Settings size={20} />, label: '设置' },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">CrystalBelt</h1>
          <p className="text-gray-400 text-sm">管理后台</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition ${
                location.pathname === item.path ? 'bg-gray-800 text-white border-l-4 border-purple-500' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{admin?.username}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}