import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../index.js'
import { z } from 'zod'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'belt-admin-secret-key-change-in-production'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body)
    const admin = await prisma.admin.findUnique({ where: { username } })

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ adminId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Verify token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, username: true, name: true, role: true }
    })

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' })
    }

    res.json(admin)
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string }
    const { currentPassword, newPassword } = req.body

    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } })
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' })
    }

    if (!bcrypt.compareSync(currentPassword, admin.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const hashed = bcrypt.hashSync(newPassword, 10)
    await prisma.admin.update({
      where: { id: decoded.adminId },
      data: { password: hashed }
    })

    res.json({ message: 'Password changed successfully' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as authRouter }
