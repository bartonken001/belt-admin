import { useState, useEffect } from 'react'
import { Card, Statistic, Table, message } from 'antd'
import { DollarSign, TrendingUp, Wallet } from 'lucide-react'
import api from '../api'

export default function Finance() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFinance = async () => {
    setLoading(true)
    try {
      const res = await api.get('/finance')
      setAccounts(res.data.accounts || [])
      setTransactions(res.data.transactions || [])
    } catch (err) {
      message.error('获取财务数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinance()
  }, [])

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  const accountColumns = [
    { title: '账户名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type' },
    { title: '余额', dataIndex: 'balance', render: (b: number) => `$${b?.toFixed(2)}` },
  ]

  const txColumns = [
    { title: '类型', dataIndex: 'type' },
    { title: '金额', dataIndex: 'amount', render: (a: number) => `$${a?.toFixed(2)}` },
    { title: '描述', dataIndex: 'description' },
    { title: '日期', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">财务管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card loading={loading} className="shadow-sm">
          <Statistic
            title="账户总额"
            value={totalBalance}
            precision={2}
            prefix={<DollarSign className="inline mr-1 text-green-500" />}
          />
        </Card>
        <Card loading={loading} className="shadow-sm">
          <Statistic
            title="待处理提现"
            value={0}
            prefix={<Wallet className="inline mr-1 text-orange-500" />}
          />
        </Card>
        <Card loading={loading} className="shadow-sm">
          <Statistic
            title="本月收入"
            value={0}
            precision={2}
            prefix={<TrendingUp className="inline mr-1 text-blue-500" />}
          />
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">账户</h2>
      <Table columns={accountColumns} dataSource={accounts} rowKey="id" loading={loading} className="mb-6" />

      <h2 className="text-lg font-semibold text-gray-800 mb-4">最近交易</h2>
      <Table columns={txColumns} dataSource={transactions} rowKey="id" loading={loading} />
    </div>
  )
}