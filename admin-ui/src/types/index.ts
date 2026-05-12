export interface Admin {
  id: string
  username: string
  name?: string
  role: string
  createdAt: string
}

export interface Product {
  id: string
  title: string
  handle: string
  description: string
  price: number
  compareAtPrice?: number
  cost?: number
  sku?: string
  barcode?: string
  stock: number
  images?: string
  type: string
  tags?: string
  isActive: boolean
  isFeatured: boolean
  weight?: number
  dimensions?: string
  categoryId?: string
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface Customer {
  id: string
  email: string
  name?: string
  phone?: string
  totalSpent: number
  orderCount: number
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId?: string
  customer?: Customer
  email: string
  name: string
  phone: string
  shippingAddress: string
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  trackingUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ChatSession {
  id: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  status: string
  lastMessage?: string
  unreadCount: number
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  sessionId: string
  message: string
  isFromAdmin: boolean
  isAI: boolean
  readAt?: string
  createdAt: string
}

export interface Config {
  id: string
  key: string
  value: string
  type: string
  group: string
}

export interface SiteContact {
  id: string
  type: string
  label: string
  value: string
  isPublic: boolean
  sortOrder: number
}

export interface FinanceAccount {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

export interface MarketingPromotion {
  id: string
  name: string
  type: string
  code?: string
  value?: number
  minPurchase?: number
  maxDiscount?: number
  startsAt: string
  endsAt: string
  usageLimit?: number
  usageCount: number
  isActive: boolean
}