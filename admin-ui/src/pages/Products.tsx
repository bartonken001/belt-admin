import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Upload, Image } from 'antd'
import { Plus, Edit2, Trash2, Upload as UploadIcon, Search } from 'lucide-react'
import api from '../api'
import type { Product, Category } from '../types'

const { TextArea } = Input

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form] = Form.useForm()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products', { params: { page, search } })
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      message.error('获取商品失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error('获取分类失败')
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [page, search])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`)
      message.success('商品已删除')
      fetchProducts()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, values)
        message.success('商品已更新')
      } else {
        await api.post('/products', values)
        message.success('商品已创建')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      fetchProducts()
    } catch (err: any) {
      message.error(err.response?.data?.error || '保存失败')
    }
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    form.setFieldsValue(product)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      form.setFieldValue('images', res.data.url)
      message.success('图片上传成功')
    } catch (err) {
      message.error('上传失败')
    }
    return false
  }

  const columns = [
    {
      title: '图片',
      dataIndex: 'images',
      render: (img: string) => img ? <Image src={img} width={60} height={60} className="object-cover rounded" /> : <div className="w-15 h-15 bg-gray-200 rounded" />
    },
    { title: '名称', dataIndex: 'title' },
    { title: '别名', dataIndex: 'handle' },
    { title: '价格', dataIndex: 'price', render: (p: number) => `$${p?.toFixed(2)}` },
    { title: '库存', dataIndex: 'stock' },
    { title: '类型', dataIndex: 'type' },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (active: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {active ? '上架' : '下架'}
        </span>
      )
    },
    {
      title: '操作',
      render: (_: any, record: Product) => (
        <div className="flex gap-2">
          <Button size="small" icon={<Edit2 size={14} />} onClick={() => openEdit(record)} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
          添加商品
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="搜索商品..."
          prefix={<Search size={16} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 件商品`
        }}
      />

      <Modal
        title={editing ? '编辑商品' : '新建商品'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true, stock: 0 }}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="title" label="商品名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="handle" label="商品别名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="price" label="价格" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="compareAtPrice" label="原价">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="cost" label="成本">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="sku" label="SKU">
              <Input />
            </Form.Item>
            <Form.Item name="stock" label="库存">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={[
                { value: 'belt', label: '腰带' },
                { value: 'keychain', label: '钥匙扣' },
                { value: 'charm', label: '饰品' },
                { value: 'tshirt', label: 'T恤' },
                { value: 'chain', label: '项链' },
                { value: 'cap', label: '帽子' },
                { value: 'other', label: '其他' }
              ]} />
            </Form.Item>
            <Form.Item name="categoryId" label="分类">
              <Select
                allowClear
                placeholder="选择分类"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          </div>

          <Form.Item name="images" label="图片">
            <div className="flex gap-4 items-start">
              <Upload beforeUpload={handleImageUpload} showUploadList={false}>
                <Button icon={<UploadIcon size={16} />}>上传图片</Button>
              </Upload>
              <Form.Item noStyle>
                <Input placeholder="或输入图片URL" />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 上架
            </label>
          </Form.Item>

          <Form.Item name="isFeatured" valuePropName="checked">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 精选推荐
            </label>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editing ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}