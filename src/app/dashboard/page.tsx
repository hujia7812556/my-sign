'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseComponentClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

/**
 * 仪表板页面组件
 * 显示用户信息和提供登出功能
 */
export default function DashboardPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseComponentClient())
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    /**
     * 获取当前用户信息
     */
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('获取用户信息失败:', error)
          router.push('/login')
          return
        }
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUser(user)
      } catch (error) {
        console.error('获取用户信息异常:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
  }, [supabase, router])
  
  /**
   * 处理用户登出
   */
  const handleLogout = async () => {
    try {
      setLoading(true)
      
      // 调用登出 API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // 重定向到登录页
        window.location.href = '/login'
      } else {
        console.error('登出失败')
        // 即使 API 失败，也尝试客户端登出
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('登出异常:', error)
      // 即使发生异常，也尝试客户端登出
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null // 会被重定向到登录页
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                统一登录系统
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                欢迎, {user.email}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {loading ? '登出中...' : '登出'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                用户信息
              </h2>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    用户 ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {user.id}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    邮箱地址
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.email}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    邮箱验证状态
                  </dt>
                  <dd className="mt-1 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.email_confirmed_at 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.email_confirmed_at ? '已验证' : '未验证'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    注册时间
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleString('zh-CN')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    最后登录
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleString('zh-CN')
                      : '无记录'
                    }
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    认证提供商
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.app_metadata?.provider || '邮箱'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* 应用链接 */}
          <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                应用访问
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                您现在可以访问以下受保护的应用：
              </p>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  href="https://app1.mydomain.com"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-gray-900">应用 1</h3>
                  <p className="text-sm text-gray-500">app1.mydomain.com</p>
                </a>
                
                <a
                  href="https://app2.mydomain.com"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-gray-900">应用 2</h3>
                  <p className="text-sm text-gray-500">app2.mydomain.com</p>
                </a>
                
                <a
                  href="https://app3.mydomain.com"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-gray-900">应用 3</h3>
                  <p className="text-sm text-gray-500">app3.mydomain.com</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}