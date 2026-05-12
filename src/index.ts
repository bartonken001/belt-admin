import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.js'
import { productRouter } from './routes/products.js'
import { categoryRouter } from './routes/categories.js'
import { orderRouter } from './routes/orders.js'
import { customerRouter } from './routes/customers.js'
import { financeRouter } from './routes/finance.js'
import { chatRouter } from './routes/chat.js'
import { configRouter } from './routes/config.js'
import { settingsRouter } from './routes/settings.js'
import { marketingRouter } from './routes/marketing.js'
import { adminRouter } from './routes/admins.js'
import { uploadRouter } from './routes/upload.js'
import { PrismaClient } from '@prisma/client'

dotenv.config()

export const prisma = new PrismaClient()

const app = express()

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static file serving for uploads
app.use('/uploads', express.static('uploads'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)
app.use('/api/categories', categoryRouter)
app.use('/api/orders', orderRouter)
app.use('/api/customers', customerRouter)
app.use('/api/finance', financeRouter)
app.use('/api/chat', chatRouter)
app.use('/api/config', configRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/marketing', marketingRouter)
app.use('/api/admins', adminRouter)
app.use('/api/upload', uploadRouter)

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Belt Admin API running on port ${PORT}`)
})
