import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
    }
  }
})

// Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    res.json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) {
      return res.status(400).json({ error: 'No files uploaded' })
    }
    res.json({
      files: files.map(f => ({
        url: `/uploads/${f.filename}`,
        filename: f.filename
      }))
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as uploadRouter }
