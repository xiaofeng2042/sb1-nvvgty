import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id } = req.query

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  })

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const apiUrl = process.env.COZE_API_URL
    const apiToken = process.env.COZE_API_TOKEN
    const botId = process.env.COZE_BOT_ID

    if (!apiUrl || !apiToken || !botId) {
      throw new Error('Missing required environment variables')
    }
    
    sendEvent('debug', { message: 'Sending request to Coze API', url: apiUrl })

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
        conversation_id: conversation_id || undefined,
        additional_messages: [
          {
            role: "user",
            content: message,
            content_type: "text"
          }
        ]
      }),
    })

    if (!apiResponse.ok) {
      throw new Error(`API response not OK: ${apiResponse.status} ${apiResponse.statusText}`)
    }

    if (!apiResponse.body) {
      throw new Error('No response body')
    }

    sendEvent('debug', 'Started receiving response from Coze API')

    let buffer = ''
    for await (const chunk of apiResponse.body) {
      buffer += chunk.toString()
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()
          if (data === '[DONE]') {
            sendEvent('done', '[DONE]')
          } else {
            try {
              const parsedData = JSON.parse(data)
              sendEvent(parsedData.event, parsedData.data)
            } catch (error) {
              console.error('Error parsing event data:', error)
              sendEvent('error', { message: 'Error parsing event data', error: error.message })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in API route:', error)
    sendEvent('error', { message: 'Error occurred while processing the request', error: error.message })
  } finally {
    res.end()
  }
}