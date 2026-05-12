import { useState, useEffect } from 'react'
import { Form, Input, Button, message, Card, Tabs, Modal } from 'antd'
import { Globe, Palette, FileText, Star, Save, Check } from 'lucide-react'
import api from '../api'

const { TextArea } = Input

// Contact Us has special structured fields
interface ContactFields {
  email: string
  phone: string
  hours: string
  address: string
  wholesale: string
}

const CONTENT_PAGES = [
  { key: 'about_us', label: 'About Us', title: '关于我们' },
  { key: 'faq', label: 'FAQ', title: '常见问题' },
  { key: 'shipping_info', label: 'Shipping Info', title: '物流信息' },
  { key: 'returns_exchanges', label: 'Returns & Exchanges', title: '退换货' },
  { key: 'size_guide', label: 'Size Guide', title: '尺码指南' },
  { key: 'wholesale', label: 'Wholesale', title: '批发合作' },
]

const COLLECTIONS = [
  { key: 'hot_this_week', label: 'Hot This Week', title: '本周热门' },
  { key: 'new_arrivals', label: 'New Arrivals', title: '新品上市' },
  { key: 'sales', label: 'Sales', title: '特价促销' },
  { key: 'weekend_picks', label: 'Weekend Picks', title: '周末精选' },
  { key: 'limited_time', label: 'Limited Time Offer', title: '限时优惠' },
  { key: 'outfits', label: 'Outfits', title: '搭配推荐' },
]

// Parse contact info from storage format
const parseContactInfo = (value: string): ContactFields => {
  const lines = value.split('\n')
  const fields: ContactFields = { email: '', phone: '', hours: '', address: '', wholesale: '' }
  lines.forEach(line => {
    const [key, ...rest] = line.split(':')
    if (!key || rest.length === 0) return
    const value = rest.join(':').trim()
    const k = key.trim().toLowerCase()
    if (k === 'email') fields.email = value
    else if (k === 'phone') fields.phone = value
    else if (k === 'hours') fields.hours = value
    else if (k === 'address') fields.address = value
    else if (k === 'wholesale') fields.wholesale = value
  })
  return fields
}

// Serialize contact fields to storage format
const serializeContactInfo = (fields: ContactFields): string => {
  return `email:${fields.email}\nphone:${fields.phone}\nhours:${fields.hours}\naddress:${fields.address}\nwholesale:${fields.wholesale}`
}

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [contents, setContents] = useState<Record<string, string>>({})
  const [localContent, setLocalContent] = useState<Record<string, string>>({})
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [contactForm] = Form.useForm()

  const fetchContents = async () => {
    try {
      const res = await api.get('/settings')
      const contentData = res.data.content || {}
      setContents(contentData)
      setLocalContent(contentData)
    } catch (err) {
      message.error('获取内容失败')
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get('/settings/products')
      setAvailableProducts(res.data || [])
    } catch (err) {
      console.error('获取商品失败')
    }
  }

  useEffect(() => {
    fetchContents()
    fetchProducts()
  }, [])

  // Save simple content page
  const handleSimpleContentSave = async (key: string, value: string) => {
    if (!value) {
      message.warning('请输入内容')
      return
    }
    setLoading(true)
    try {
      await api.put(`/settings/content/${key}`, { value })
      message.success('保存成功')
      fetchContents()
    } catch (err) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // Save Contact Us with structured fields
  const handleContactSave = async () => {
    const values = contactForm.getFieldsValue()
    const serialized = serializeContactInfo(values)
    setLoading(true)
    try {
      await api.put('/settings/content/contact_us', { value: serialized })
      message.success('保存成功')
      fetchContents()
    } catch (err) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const openCollectionModal = async (collectionKey: string) => {
    setSelectedCollection(collectionKey)
    setCollectionLoading(true)
    setCollectionModalOpen(true)

    try {
      const res = await api.get(`/settings/collections/${collectionKey}`)
      setSelectedProducts(res.data.productIds || [])
    } catch (err) {
      setSelectedProducts([])
    } finally {
      setCollectionLoading(false)
    }
  }

  const saveCollection = async () => {
    try {
      await api.put(`/settings/collections/${selectedCollection}`, { productIds: selectedProducts })
      message.success('保存成功')
      setCollectionModalOpen(false)
    } catch (err) {
      message.error('保存失败')
    }
  }

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  // Render Contact Us special form
  const renderContactUsForm = () => {
    const contactValue = contents['contact_us'] || ''
    const parsed = parseContactInfo(contactValue)
    contactForm.setFieldsValue(parsed)

    return (
      <Card className="mt-4">
        <p className="text-gray-500 text-sm mb-4">编辑联系我们页面信息</p>
        <Form form={contactForm} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="email" label="邮箱">
              <Input placeholder="support@crystalbelt.com" />
            </Form.Item>
            <Form.Item name="phone" label="电话">
              <Input placeholder="+1 (888) 888-BELT" />
            </Form.Item>
          </div>
          <Form.Item name="hours" label="营业时间">
            <Input placeholder="Mon-Fri 9AM-6PM EST" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <TextArea rows={3} placeholder="CrystalBelt Returns Center&#10;123 Bling Avenue, Suite 100&#10;Los Angeles, CA 90015" />
          </Form.Item>
          <Form.Item name="wholesale" label="批发邮箱">
            <Input placeholder="wholesale@crystalbelt.com" />
          </Form.Item>
          <Button
            type="primary"
            icon={<Save size={14} />}
            loading={loading}
            onClick={handleContactSave}
          >
            保存
          </Button>
        </Form>
      </Card>
    )
  }

  const contentTabItems = [
    // Contact Us has special form
    {
      key: 'contact_us',
      label: '联系我们',
      children: renderContactUsForm()
    },
    // Other pages use simple textarea
    ...CONTENT_PAGES.map(page => ({
      key: page.key,
      label: page.title,
      children: (
        <Card className="mt-4">
          <p className="text-gray-500 text-sm mb-4">编辑 {page.title} 页面内容</p>
          <Form layout="vertical">
            <Form.Item>
              <TextArea
                rows={12}
                placeholder={`输入 ${page.title} 的内容...`}
                value={localContent[page.key] || contents[page.key] || ''}
                onChange={(e) => setLocalContent({ ...localContent, [page.key]: e.target.value })}
              />
            </Form.Item>
            <Button
              type="primary"
              icon={<Save size={14} />}
              loading={loading}
              onClick={() => handleSimpleContentSave(page.key, localContent[page.key] || '')}
            >
              保存
            </Button>
          </Form>
        </Card>
      )
    }))
  ]

  const generalItems = [
    {
      key: 'general',
      label: <span className="flex items-center gap-2"><Globe size={16} /> 常规设置</span>,
      children: (
        <Card className="mt-4">
          <Form layout="vertical">
            <Form.Item label="网站名称">
              <Input placeholder="CrystalBelt" />
            </Form.Item>
            <Form.Item label="网站标语">
              <Input placeholder="Sparkle with CrystalBelt" />
            </Form.Item>
            <Button type="primary" icon={<Save size={14} />}>保存</Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'appearance',
      label: <span className="flex items-center gap-2"><Palette size={16} /> 外观设置</span>,
      children: (
        <Card className="mt-4">
          <Form layout="vertical">
            <Form.Item label="背景颜色">
              <Input type="color" className="w-20 h-10" />
            </Form.Item>
            <Form.Item label="主题颜色">
              <Input type="color" className="w-20 h-10" />
            </Form.Item>
            <Form.Item label="Logo地址">
              <Input placeholder="https://..." />
            </Form.Item>
            <Button type="primary" icon={<Save size={14} />}>保存</Button>
          </Form>
        </Card>
      )
    }
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">网站设置</h1>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: 'content',
            label: <span className="flex items-center gap-2"><FileText size={16} /> 内容页面</span>,
            children: (
              <div className="mt-4">
                <Tabs tabPosition="left" items={contentTabItems} />
              </div>
            )
          },
          {
            key: 'collections',
            label: <span className="flex items-center gap-2"><Star size={16} /> 精选推荐</span>,
            children: (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">管理首页精选推荐板块，勾选要展示的商品</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {COLLECTIONS.map(col => (
                    <Card
                      key={col.key}
                      title={col.title}
                      hoverable
                      onClick={() => openCollectionModal(col.key)}
                      className="cursor-pointer"
                    >
                      <p className="text-gray-500 text-sm">点击选择商品</p>
                    </Card>
                  ))}
                </div>
              </div>
            )
          },
          ...generalItems
        ]}
      />

      <Modal
        title={`选择商品 - ${COLLECTIONS.find(c => c.key === selectedCollection)?.title || ''}`}
        open={collectionModalOpen}
        onCancel={() => setCollectionModalOpen(false)}
        onOk={saveCollection}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <div className="max-h-96 overflow-auto">
          {collectionLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : availableProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无可用商品，请先添加商品</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 ${
                    selectedProducts.includes(product.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                    selectedProducts.includes(product.id)
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedProducts.includes(product.id) && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{product.title}</div>
                    <div className="text-sm text-gray-500">${product.price?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-500">已选择 {selectedProducts.length} 个商品</div>
      </Modal>
    </div>
  )
}