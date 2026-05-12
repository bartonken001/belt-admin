import { Router } from 'express'
import { prisma } from '../index.js'
import { v4 as uuid } from 'uuid'

const router = Router()

// List orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search, dateFrom, dateTo } = req.query

    const where: any = {}
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { email: { contains: search as string } },
        { name: { contains: search as string } }
      ]
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
      if (dateTo) where.createdAt.lte = new Date(dateTo as string)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 5 }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    res.json({ orders, total, page: Number(page), limit: Number(limit) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
        timeline: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, message } = req.body

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    })

    await prisma.orderTimeline.create({
      data: { orderId: order.id, status, message: message || `Status changed to ${status}` }
    })

    await prisma.log.create({
      data: { action: 'UPDATE', entityType: 'order', entityId: order.id, details: JSON.stringify({ status }) }
    })

    res.json(order)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Add shipment/tracking
router.post('/:id/ship', async (req, res) => {
  try {
    const { carrier, trackingNumber, trackingUrl } = req.body

    await prisma.shipment.create({
      data: { orderId: req.params.id, carrier, trackingNumber, trackingUrl, status: 'shipped' }
    })

    await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'shipped', trackingNumber, trackingUrl }
    })

    await prisma.orderTimeline.create({
      data: {
        orderId: req.params.id,
        status: 'shipped',
        message: `Shipped via ${carrier}: ${trackingNumber}`
      }
    })

    res.json({ message: 'Shipment added' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Issue refund
router.post('/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'refunded', paymentStatus: 'refunded' }
    })

    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'refunded',
        message: reason || `Refund issued: $${amount}`
      }
    })

    await prisma.financeTransaction.create({
      data: {
        type: 'refund',
        amount: -amount,
        description: `Refund for order ${order.orderNumber}`,
        category: 'refund',
        referenceType: 'order',
        referenceId: order.id,
        accountId: 'default',
        createdBy: 'system'
      }
    })

    res.json({ message: 'Refund processed' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalOrders, pendingOrders, processingOrders, shippedOrders, todayOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
      })
    ])

    const revenue = await prisma.order.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { total: true }
    })

    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      todayOrders,
      totalRevenue: revenue._sum.total || 0
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export { router as orderRouter }
