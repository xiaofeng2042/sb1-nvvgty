import { useState } from 'react'

interface Expense {
  uuid: string;
  date: string;
  amount: string;
  category: string;
  id?: string;
}

// 定义主页组件
export default function Home() {
  // 使用 useState 钩子管理状态
  const [message, setMessage] = useState('') // 用户输入的消息
  const [response, setResponse] = useState<Expense[]>([]) // API 返回的响应
  const [isLoading, setIsLoading] = useState(false) // 加载状态
  const [error, setError] = useState<string | null>(null) // 错误信息

  // 处理表单提交的异步函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单默认提交行为
    setIsLoading(true) // 设置加载状态为 true
    setResponse([]) // 清空之前的响应
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
        // 解析响应内容
        const lines = data.response.split('\n')
        const expenses: Expense[] = lines.map((line, index) => {
          const match = line.match(/日期：(.*?)，开支项目：(.*?)，开支金额：(.*)/)
          if (match) {
            return {
              uuid: `temp-${index}`,
              date: match[1],
              category: match[2],
              amount: match[3]
            }
          }
          return null
        }).filter(Boolean)

        if (expenses.length > 0) {
          setResponse(expenses)
        } else {
          setResponse([{ uuid: 'temp', date: '', amount: '', category: data.response }])
        }
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
      {response.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">记录清单：</h2>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">日期</th>
                <th className="py-2 px-4 border-b">金额</th>
                <th className="py-2 px-4 border-b">类别</th>
              </tr>
            </thead>
            <tbody>
              {response.map((item, index) => (
                <tr key={item.uuid || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border-b">{item.date}</td>
                  <td className="py-2 px-4 border-b">{item.amount}</td>
                  <td className="py-2 px-4 border-b">{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}