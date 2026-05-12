import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// Get all settings (content pages + collections)
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.websiteConfig.findMany()
    const content: Record<string, string> = {}
    const collections: Record<string, string[]> = {}

    configs.forEach(c => {
      if (c.group === 'content') {
        content[c.key.replace('content_', '')] = c.value
      } else if (c.group === 'collection') {
        try {
          collections[c.key.replace('collection_', '')] = JSON.parse(c.value)
        } catch {
          collections[c.key.replace('collection_', '')] = []
        }
      }
    })

    res.json({ content, collections })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get content page
router.get('/content/:key', async (req, res) => {
  try {
    const key = `content_${req.params.key}`
    const config = await prisma.websiteConfig.findUnique({ where: { key } })
    res.json({ value: config?.value || '' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update content page
router.put('/content/:key', async (req, res) => {
  try {
    const { value } = req.body
    const key = `content_${req.params.key}`

    const config = await prisma.websiteConfig.upsert({
      where: { key },
      update: { value, group: 'content' },
      create: { key, value, type: 'text', group: 'content' }
    })

    res.json(config)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get collection (with products)
router.get('/collections/:name', async (req, res) => {
  try {
    const key = `collection_${req.params.name}`
    const config = await prisma.websiteConfig.findUnique({ where: { key } })

    let productIds: string[] = []
    if (config) {
      try {
        productIds = JSON.parse(config.value)
      } catch {}
    }

    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true, handle: true, price: true, images: true }
        })
      : []

    // Sort by the order in productIds
    products.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id))

    res.json({ products, productIds })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update collection (assign products)
router.put('/collections/:name', async (req, res) => {
  try {
    const { productIds } = req.body
    const key = `collection_${req.params.name}`
    const value = JSON.stringify(productIds || [])

    const config = await prisma.websiteConfig.upsert({
      where: { key },
      update: { value, group: 'collection' },
      create: { key, value, type: 'json', group: 'collection' }
    })

    res.json(config)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get all products for selection
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, title: true, handle: true, price: true, images: true, isFeatured: true }
    })
    res.json(products)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export { router as settingsRouter }