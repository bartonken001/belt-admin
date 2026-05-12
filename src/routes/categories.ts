import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// List categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(categories)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, description, parentId, image, sortOrder } = req.body
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const category = await prisma.category.create({
      data: { name, slug, description, parentId, image, sortOrder: sortOrder || 0 }
    })

    await prisma.log.create({
      data: { action: 'CREATE', entityType: 'category', entityId: category.id }
    })

    res.json(category)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description, parentId, image, sortOrder, isActive } = req.body

    let slug
    if (name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, parentId, image, sortOrder, isActive, slug }
    })

    res.json(category)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    // Check if category has products
    const count = await prisma.product.count({ where: { categoryId: req.params.id } })
    if (count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products. Move or delete products first.' })
    }

    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as categoryRouter }
