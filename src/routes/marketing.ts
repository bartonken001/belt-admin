import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// List promotions
router.get('/', async (req, res) => {
  try {
    const promotions = await prisma.marketingPromotion.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(promotions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create promotion
router.post('/', async (req, res) => {
  try {
    const promotion = await prisma.marketingPromotion.create({ data: req.body })
    res.json(promotion)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update promotion
router.put('/:id', async (req, res) => {
  try {
    const promotion = await prisma.marketingPromotion.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(promotion)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Delete promotion
router.delete('/:id', async (req, res) => {
  try {
    await prisma.marketingPromotion.delete({ where: { id: req.params.id } })
    res.json({ message: 'Promotion deleted' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as marketingRouter }
