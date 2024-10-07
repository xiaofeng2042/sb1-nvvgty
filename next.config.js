/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    COZE_API_URL: process.env.COZE_API_URL,
    COZE_BOT_ID: process.env.COZE_BOT_ID,
  },
}

module.exports = nextConfig