// 导入 Next.js 的类型定义
import type { NextApiRequest, NextApiResponse } from 'next'

// 定义 API 路由处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 检查请求方法是否为 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' })
  }

  // 从请求体中解构出 message
  const { message } = req.body

  // 验证 message 是否存在且为字符串
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: '消息是必需的' })
  }

  try {
    // 从环境变量中获取 API 相关信息
    const apiUrl = process.env.COZE_API_URL
    const apiToken = process.env.COZE_API_TOKEN
    const botId = process.env.COZE_BOT_ID

    // 检查必要的环境变量是否存在
    if (!apiUrl || !apiToken || !botId) {
      throw new Error('缺少必需的环境变量')
    }

    // 发送请求到 Coze API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: "123456789",
        stream: true,
        auto_save_history: true,
        additional_messages: [
          {
            role: "user",
            content: message,
            content_type: "text"
          }
        ]
      }),
    })

    // 检查 API 响应是否成功
    if (!apiResponse.ok) {
      throw new Error(`API 请求失败: ${apiResponse.statusText}`)
    }

    // 获取响应流的读取器
    const reader = apiResponse.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    // 读取并拼接完整的响应
    let fullResponse = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = new TextDecoder().decode(value)
      fullResponse += chunk
      console.log('Received chunk:', chunk) // 输出每个接收到的数据块
    }

    // 处理响应并返回结果
    const processedResponse = processResponse(fullResponse)
    console.log('Processed response:', processedResponse) // 输出处理后的完整响应
    if (!processedResponse) {
      console.log('Warning: Processed response is empty')
    }
    res.status(200).json({ response: processedResponse })
  } catch (error) {
    // 错误处理
    console.error('Error:', error)
    res.status(500).json({ error: '发生错误，请重试' })
  }
}

// 处理 Coze API 的流式响应
function processResponse(response: string): string {
  const lines = response.split('\n')
  let finalContent = ''
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const data = JSON.parse(line.slice(5))
        console.log('Processed line:', data) // 保留这行用于调试
        if (data.content) {
          finalContent += data.content
        } else if (data.data && data.data.content) {
          finalContent += data.data.content
        }
      } catch (error) {
        console.error('解析响应时出错:', error)
      }
    }
  }
  return finalContent
}