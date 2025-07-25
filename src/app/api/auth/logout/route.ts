import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { clearAuthCookie } from '@/lib/auth'

/**
 * 用户登出接口
 * 清除用户会话和认证 Cookie
 * @param request - Next.js 请求对象
 * @returns 重定向到登录页面
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // 从 Supabase 登出
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
    }
    
    // 获取重定向 URL
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirect') || '/login'
    
    // 创建响应并清除认证 Cookie
    const response = NextResponse.redirect(new URL(redirectTo, request.url))
    clearAuthCookie(response)
    
    console.log('User logged out successfully')
    
    return response
    
  } catch (error) {
    console.error('Logout unexpected error:', error)
    
    // 即使发生错误也要清除 Cookie
    const response = NextResponse.redirect(new URL('/login', request.url))
    clearAuthCookie(response)
    
    return response
  }
}

/**
 * 处理 GET 请求的登出（支持链接形式的登出）
 */
export async function GET(request: NextRequest) {
  return POST(request)
}