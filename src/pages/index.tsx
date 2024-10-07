import { useState } from 'react'

// 定义主页组件
export default function Home() {
  // 使用 useState 钩子管理状态
  const [message, setMessage] = useState('') // 用户输入的消息
  const [response, setResponse] = useState('') // API 返回的响应
  const [isLoading, setIsLoading] = useState(false) // 加载状态
  const [error, setError] = useState<string | null>(null) // 错误信息

  // 处理表单提交的异步函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单默认提交行为
    setIsLoading(true) // 设置加载状态为 true
    setResponse('') // 清空之前的响应
    setError(null) // 清空之前的错误信息

    try {
      // 发送 POST 请求到 /api/chat 端点
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }), // 将用户消息作为 JSON 发送
      })

      if (!res.ok) {
        throw new Error('网络响应不正常')
      }

      const data = await res.json() // 解析响应 JSON
      console.log('Frontend received data:', data)
      
      if (data.response) {
        setResponse(data.response)
      } else {
        setError('响应为空')
      }
    } catch (err) {
      setError('发生错误，请重试') // 设置错误信息
      console.error('Error:', err) // 在控制台输出详细错误
    } finally {
      setIsLoading(false) // 无论成功与否，都将加载状态设为 false
    }
  }

  // 渲染组件 UI
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">与 Coze API 聊天</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="输入您的消息"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {response && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">响应：</h2>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  )
}