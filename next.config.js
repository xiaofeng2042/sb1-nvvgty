/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    COZE_API_URL: process.env.COZE_API_URL,
    COZE_BOT_ID: process.env.COZE_BOT_ID,
  },
  // 添加以下配置
  server: {
    hostname: '127.0.0.1',
    port: 3000
  }
}

module.exports = nextConfig