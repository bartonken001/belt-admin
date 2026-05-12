import { Router } from 'express'
import { prisma } from '../index.js'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'

const router = Router()

// List all products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, type, status } = req.query

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { handle: { contains: search as string } },
        { sku: { contains: search as string } }
      ]
    }
    if (category) where.categoryId = category
    if (type) where.type = type
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    res.json({ products, total, page: Number(page), limit: Number(limit) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create product
router.post('/', async (req, res) => {
  try {
    const data = req.body
    if (!data.handle) {
      data.handle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        images: data.images ? JSON.stringify(data.images) : null
      }
    })

    await prisma.log.create({
      data: { action: 'CREATE', entityType: 'product', entityId: product.id }
    })

    res.json(product)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update product
router.put('/:id', async (req, res) => {
  try {
    const data = req.body
    if (data.images && typeof data.images !== 'string') {
      data.images = JSON.stringify(data.images)
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data
    })

    await prisma.log.create({
      data: { action: 'UPDATE', entityType: 'product', entityId: product.id }
    })

    res.json(product)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    await prisma.log.create({
      data: { action: 'DELETE', entityType: 'product', entityId: req.params.id }
    })
    res.json({ message: 'Product deleted' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Bulk update stock
router.post('/bulk-stock', async (req, res) => {
  try {
    const { updates } = req.body // [{id, stock}]
    for (const update of updates) {
      await prisma.product.update({
        where: { id: update.id },
        data: { stock: update.stock }
      })
    }
    res.json({ message: 'Stock updated' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as productRouter }
