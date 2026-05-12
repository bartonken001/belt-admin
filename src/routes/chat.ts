import { Router } from 'express'
import { prisma } from '../index.js'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

const anthropic = new Anthropic()

// Get chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status: status as string } : {}

    const sessions = await prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
    res.json(sessions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single session with messages
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: { sessionId: req.params.id, isFromAdmin: false, readAt: null },
      data: { readAt: new Date() }
    })

    await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { unreadCount: 0 }
    })

    res.json(session)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Send admin reply
router.post('/sessions/:id/reply', async (req, res) => {
  try {
    const { message } = req.body
    const sessionId = req.params.id

    const msg = await prisma.chatMessage.create({
      data: {
        sessionId,
        message,
        isFromAdmin: true,
        isAI: false
      }
    })

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessage: message, updatedAt: new Date() }
    })

    res.json(msg)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// AI auto-reply
router.post('/sessions/:id/ai-reply', async (req, res) => {
  try {
    const { message } = req.body
    const sessionId = req.params.id

    // Get session context
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
    })

    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Build context for AI
    const contextMessages = session.messages.map(m => ({
      role: m.isFromAdmin ? 'assistant' : 'user',
      content: m.message
    }))

    // Add current message
    contextMessages.push({ role: 'user' as const, content: message })

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a helpful customer service representative for CrystalBelt, a rhinestone belt and accessories e-commerce store.
Your role is to:
- Help customers with their inquiries about products, orders, shipping, returns, etc.
- Be friendly, professional, and knowledgeable
- If you cannot help with a specific issue, suggest they contact human support
- Keep responses concise and helpful

Store info:
- Products: Rhinestone belts, keychains, charms, T-shirts, chains, caps
- Shipping: Free over $50, 5-7 business days
- Returns: 30-day return policy
- Wholesale: Available for bulk orders`,
      messages: contextMessages
    })

    const aiReply = response.content[0].type === 'text' ? response.content[0].text : 'Thank you for your message. Our team will get back to you shortly.'

    // Save AI message
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        message: aiReply,
        isFromAdmin: false,
        isAI: true
      }
    })

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessage: aiReply, updatedAt: new Date() }
    })

    res.json(aiMessage)
  } catch (err: any) {
    console.error('AI reply error:', err)
    res.status(500).json({ error: 'Failed to generate AI reply' })
  }
})

// Close session
router.put('/sessions/:id/close', async (req, res) => {
  try {
    const session = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { status: 'closed' }
    })
    res.json(session)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.chatSession.aggregate({
      where: { status: 'active' },
      _sum: { unreadCount: true }
    })
    res.json({ count: count._sum.unreadCount || 0 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export { router as chatRouter }
