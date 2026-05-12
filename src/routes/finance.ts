import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// Get accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.financeAccount.findMany({ orderBy: { createdAt: 'asc' } })
    res.json(accounts)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create account
router.post('/accounts', async (req, res) => {
  try {
    const account = await prisma.financeAccount.create({ data: req.body })
    res.json(account)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// List transactions
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, dateFrom, dateTo } = req.query

    const where: any = {}
    if (type) where.type = type
    if (category) where.category = category
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
      if (dateTo) where.createdAt.lte = new Date(dateTo as string)
    }

    const [transactions, total] = await Promise.all([
      prisma.financeTransaction.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.financeTransaction.count({ where })
    ])

    res.json({ transactions, total, page: Number(page), limit: Number(limit) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create transaction
router.post('/transactions', async (req, res) => {
  try {
    const { type, amount, description, category, referenceType, referenceId, accountId } = req.body

    const transaction = await prisma.financeTransaction.create({
      data: {
        type,
        amount,
        description,
        category,
        referenceType,
        referenceId,
        accountId,
        createdBy: 'admin'
      }
    })

    // Update account balance
    if (type === 'income' || type === 'refund') {
      await prisma.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: amount } }
      })
    } else if (type === 'expense' || type === 'withdrawal') {
      await prisma.financeAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } }
      })
    }

    res.json(transaction)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status: status as string } : {}

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    res.json(withdrawals)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Process withdrawal
router.put('/withdrawals/:id', async (req, res) => {
  try {
    const { status, note } = req.body

    const withdrawal = await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: { status, note, processedAt: status === 'completed' ? new Date() : null }
    })

    if (status === 'completed') {
      await prisma.financeTransaction.create({
        data: {
          type: 'withdrawal',
          amount: -withdrawal.actualAmount,
          description: `Withdrawal to ${withdrawal.accountType}: ${withdrawal.accountInfo}`,
          category: 'withdrawal',
          referenceType: 'withdrawal',
          referenceId: withdrawal.id,
          accountId: 'default',
          createdBy: 'admin'
        }
      })
    }

    res.json(withdrawal)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get finance summary
router.get('/summary', async (req, res) => {
  try {
    const accounts = await prisma.financeAccount.findMany()
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    const [income, expense] = await Promise.all([
      prisma.financeTransaction.aggregate({ where: { type: 'income' }, _sum: { amount: true } }),
      prisma.financeTransaction.aggregate({ where: { type: 'expense' }, _sum: { amount: true } })
    ])

    const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: 'pending' } })

    res.json({
      totalBalance,
      totalIncome: income._sum.amount || 0,
      totalExpense: expense._sum.amount || 0,
      pendingWithdrawals
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export { router as financeRouter }
