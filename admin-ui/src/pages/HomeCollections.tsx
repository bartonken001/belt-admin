import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function HomeCollections() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/settings/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setProducts([])
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (!products.length) return <div>No products</div>

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {products.slice(0, 8).map((p: any) => (
          <div key={p.id} style={{ border: '1px solid #333', padding: 12, borderRadius: 8 }}>
            <div style={{ width: '100%', height: 100, background: '#222', borderRadius: 4 }} />
            <p style={{ fontSize: 12, margin: '8px 0 4px' }}>{p.title}</p>
            <p style={{ fontWeight: 'bold', color: '#c9a962' }}>${p.price?.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
