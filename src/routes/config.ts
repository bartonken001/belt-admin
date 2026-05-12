import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// Get all configs
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.websiteConfig.findMany({
      orderBy: { group: 'asc' }
    })
    res.json(configs)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update config
router.put('/:key', async (req, res) => {
  try {
    const { value, type, group } = req.body

    const config = await prisma.websiteConfig.upsert({
      where: { key: req.params.key },
      update: { value, type, group },
      create: { key: req.params.key, value, type: type || 'text', group: group || 'general' }
    })

    await prisma.log.create({
      data: { action: 'UPDATE', entityType: 'config', entityId: config.id, details: JSON.stringify({ key: req.params.key, value }) }
    })

    res.json(config)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get contacts
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await prisma.siteContact.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    res.json(contacts)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update contact
router.put('/contacts/:type', async (req, res) => {
  try {
    const { value, label, isPublic, sortOrder } = req.body

    const contact = await prisma.siteContact.upsert({
      where: { type: req.params.type },
      update: { value, label, isPublic, sortOrder },
      create: { type: req.params.type, value, label: label || req.params.type, isPublic: true, sortOrder: sortOrder || 0 }
    })

    res.json(contact)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get menu items
router.get('/menu', async (req, res) => {
  try {
    const menuItems = await prisma.websiteConfig.findMany({
      where: { group: 'menu' }
    })
    res.json(menuItems)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update menu item
router.put('/menu/:key', async (req, res) => {
  try {
    const { value } = req.body // {label, href, order}

    const config = await prisma.websiteConfig.upsert({
      where: { key: `menu_${req.params.key}` },
      update: { value: JSON.stringify(value) },
      create: { key: `menu_${req.params.key}`, value: JSON.stringify(value), type: 'json', group: 'menu' }
    })

    res.json(config)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as configRouter }
