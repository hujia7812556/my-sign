'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseComponentClient } from '@/lib/supabase-client'

/**
 * 登录页面组件
 * 提供类似 Clerk 风格的现代化登录界面
 */
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createSupabaseComponentClient())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const redirectUrl = searchParams.get('redirect')
  const errorParam = searchParams.get('error')
  
  /**
   * 处理登录
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理注册
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setError('请检查您的邮箱并点击确认链接')
      }
    } catch (err) {
      setError('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理 Google 登录
   */
  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(redirectUrl || '/dashboard')}`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Google 登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 设置当前域名
    if (typeof window !== 'undefined') {
      // 优先使用环境变量配置的 URL，如果没有则使用当前页面的 origin
      const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
      if (configuredUrl) {
        setOrigin(configuredUrl)
      } else {
        setOrigin(window.location.origin)
      }
    }
  }, [])
  
  useEffect(() => {
    // 显示错误信息
    if (errorParam) {
      switch (errorParam) {
        case 'no_code':
          setError('登录过程中缺少授权码，请重试')
          break
        case 'no_session':
          setError('登录会话创建失败，请重试')
          break
        case 'unexpected_error':
          setError('登录过程中发生未知错误，请重试')
          break
        default:
          setError(decodeURIComponent(errorParam))
      }
    }
    
    /**
     * 检查用户是否已登录
     */
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('检查认证状态失败:', error)
          setError('检查认证状态失败')
          return
        }
        
        if (session) {
          // 用户已登录，重定向到目标页面或仪表板
          const targetUrl = redirectUrl || '/dashboard'
          router.push(targetUrl)
        }
      } catch (error) {
        console.error('检查认证状态异常:', error)
        setError('检查认证状态异常')
      }
    }
    
    // 只有在 origin 设置后才执行认证检查
    if (origin) {
      checkAuth()
    }
  }, [router, redirectUrl, errorParam, supabase, origin])
  
  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user.email)
          
          // 构建回调 URL
          const callbackUrl = new URL('/api/auth/callback', origin)
          
          if (redirectUrl) {
            callbackUrl.searchParams.set('redirect', redirectUrl)
          }
          
          // 重定向到回调处理
          if (origin) {
            window.location.href = callbackUrl.toString()
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, redirectUrl, origin])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? '欢迎回来' : '创建账户'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'signin' ? '登录到您的账户' : '注册新账户开始使用'}
          </p>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Google 登录按钮 */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? '处理中...' : '使用 Google 继续'}
          </button>

          {/* 分割线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 邮箱密码表单 */}
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入您的邮箱"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={mode === 'signin' ? '输入您的密码' : '创建密码'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : (mode === 'signin' ? '登录' : '注册')}
            </button>
          </form>

          {/* 切换模式 */}
          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setEmail('')
                setPassword('')
              }}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              {mode === 'signin' ? '没有账户？立即注册' : '已有账户？立即登录'}
            </button>
          </div>

          {/* 重定向信息 */}
          {redirectUrl && (
            <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              登录后将重定向到: {decodeURIComponent(redirectUrl)}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            继续使用即表示您同意我们的
            <a href="#" className="text-blue-600 hover:text-blue-500 mx-1">服务条款</a>
            和
            <a href="#" className="text-blue-600 hover:text-blue-500 mx-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  )
}