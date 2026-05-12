import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 0 }
    })
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ products: [], total: 0 }, { status: 200 })
  }
}
