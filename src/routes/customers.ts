import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// List customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } }
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { addresses: true, _count: { select: { orders: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    res.json({ customers, total, page: Number(page), limit: Number(limit) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        addresses: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(customer)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Add customer note
router.post('/:id/note', async (req, res) => {
  try {
    const { note } = req.body
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { notes: note }
    })
    res.json(customer)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as customerRouter }
