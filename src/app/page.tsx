'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseComponentClient } from '@/lib/supabase-client'

/**
 * 主页面组件
 * 检查用户认证状态并重定向到相应页面
 */
export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    /**
     * 检查用户认证状态
     */
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseComponentClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('检查认证状态失败:', error)
          router.push('/login')
          return
        }
        
        if (session) {
          // 用户已登录，重定向到仪表板
          router.push('/dashboard')
        } else {
          // 用户未登录，重定向到登录页
          router.push('/login')
        }
      } catch (error) {
        console.error('检查认证状态异常:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">正在检查认证状态...</p>
      </div>
    </div>
  )
}
