import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../index.js'

const router = Router()

// List admins
router.get('/', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true }
    })
    res.json(admins)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create admin
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role } = req.body
    const hashed = bcrypt.hashSync(password, 10)

    const admin = await prisma.admin.create({
      data: { username, password: hashed, name, role: role || 'admin' }
    })

    res.json({ id: admin.id, username: admin.username, name: admin.name, role: admin.role })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update admin
router.put('/:id', async (req, res) => {
  try {
    const { name, role, password } = req.body
    const data: any = { name, role }
    if (password) {
      data.password = bcrypt.hashSync(password, 10)
    }

    const admin = await prisma.admin.update({
      where: { id: req.params.id },
      data
    })

    res.json({ id: admin.id, username: admin.username, name: admin.name, role: admin.role })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Delete admin
router.delete('/:id', async (req, res) => {
  try {
    await prisma.admin.delete({ where: { id: req.params.id } })
    res.json({ message: 'Admin deleted' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as adminRouter }
