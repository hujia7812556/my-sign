import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  
  // 服务器外部包配置
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 允许的开发环境跨域请求源（从环境变量读取）
  allowedDevOrigins: process.env.ALLOWED_DOMAINS 
    ? process.env.ALLOWED_DOMAINS.split(',').map(origin => origin.trim())
    : ['localhost', '127.0.0.1'],
  
  // 实验性功能
  experimental: {
    // 其他实验性配置可以在这里添加
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/api/auth',
        permanent: true,
      },
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
