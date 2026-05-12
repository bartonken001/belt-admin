import { useState, useEffect } from 'react'
import { List, Input, Button, Spin, message, Empty } from 'antd'
import { Send, Bot, RefreshCw } from 'lucide-react'
import api from '../api'
import type { ChatSession, ChatMessage } from '../types'

const { TextArea } = Input

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [replying, setReplying] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/chat/sessions')
      setSessions(res.data || [])
    } catch (err) {
      message.error('获取会话失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`)
      setSelectedSession(res.data)
      setMessages(res.data.messages || [])
    } catch (err) {
      message.error('获取消息失败')
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id)
    }
  }, [selectedSession?.id])

  const handleSendReply = async () => {
    if (!selectedSession || !newMessage.trim()) return
    setReplying(true)
    try {
      await api.post(`/chat/sessions/${selectedSession.id}/reply`, { message: newMessage })
      setNewMessage('')
      fetchMessages(selectedSession.id)
    } catch (err) {
      message.error('发送失败')
    } finally {
      setReplying(false)
    }
  }

  const handleAIReply = async () => {
    if (!selectedSession || !newMessage.trim()) return
    setAiLoading(true)
    try {
      await api.post(`/chat/sessions/${selectedSession.id}/ai-reply`, { message: newMessage })
      setNewMessage('')
      fetchMessages(selectedSession.id)
      message.success('AI回复已发送')
    } catch (err) {
      message.error('AI回复失败')
    } finally {
      setAiLoading(false)
    }
  }

  const closeSession = async () => {
    if (!selectedSession) return
    try {
      await api.put(`/chat/sessions/${selectedSession.id}/close`)
      message.success('会话已关闭')
      fetchSessions()
      setSelectedSession(null)
    } catch (err) {
      message.error('关闭失败')
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex gap-4">
      {/* 会话列表 */}
      <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">客服会话</h2>
          <Button size="small" icon={<RefreshCw size={14} />} onClick={fetchSessions} />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center"><Spin /></div>
          ) : sessions.length === 0 ? (
            <Empty description="暂无会话" className="mt-8" />
          ) : (
            <List
              dataSource={sessions}
              renderItem={(session) => (
                <List.Item
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedSession?.id === session.id ? 'bg-purple-50' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <List.Item.Meta
                    title={<span className="text-sm">{session.customerName || '匿名用户'}</span>}
                    description={
                      <div className="text-xs text-gray-500 truncate">
                        {session.lastMessage || '暂无消息'}
                      </div>
                    }
                  />
                  {session.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {session.unreadCount}
                    </span>
                  )}
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedSession ? (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{selectedSession.customerName || '聊天'}</h2>
                <span className="text-xs text-gray-500">
                  {selectedSession.status === 'active' ? '进行中' : '已关闭'}
                </span>
              </div>
              {selectedSession.status === 'active' && (
                <Button size="small" onClick={closeSession}>关闭会话</Button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isFromAdmin
                      ? 'bg-purple-600 text-white'
                      : msg.isAI
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      {msg.isAI && <Bot size={12} />}
                      {msg.isFromAdmin ? '客服' : msg.isAI ? 'AI' : '客户'}
                    </div>
                    <p>{msg.message}</p>
                    <div className="text-xs opacity-60 text-right mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <TextArea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="primary"
                  icon={<Send size={14} />}
                  onClick={handleSendReply}
                  loading={replying}
                  disabled={!newMessage.trim()}
                >
                  发送
                </Button>
                <Button
                  icon={<Bot size={14} />}
                  onClick={handleAIReply}
                  loading={aiLoading}
                  disabled={!newMessage.trim()}
                >
                  AI回复
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <Empty description="选择一个会话查看消息" />
          </div>
        )}
      </div>
    </div>
  )
}