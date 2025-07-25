import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { setAuthCookie, isValidRedirectUrl } from '@/lib/auth'

/**
 * Supabase 认证回调处理
 * 处理用户登录成功后的回调
 * @param request - Next.js 请求对象
 * @returns 重定向到原始页面或默认页面
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const redirectTo = searchParams.get('redirect') || searchParams.get('state')
    
    if (!code) {
      console.error('No authorization code provided')
      const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL('/login?error=no_code', baseUrl))
    }
    
    const supabase = await createSupabaseServerClient()
    
    // 交换授权码获取会话
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, baseUrl)
      )
    }
    
    if (!data.session) {
      console.error('No session returned from auth callback')
      const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL('/login?error=no_session', baseUrl))
    }
    
    // 确定重定向 URL
    let finalRedirectUrl = '/dashboard' // 默认重定向页面
    
    if (redirectTo && isValidRedirectUrl(redirectTo)) {
      finalRedirectUrl = redirectTo
    }
    
    // 创建响应并设置认证 Cookie
    const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
    const response = NextResponse.redirect(new URL(finalRedirectUrl, baseUrl))
    
    setAuthCookie(response, data.session)
    
    // 检查设置后的 Cookie
    console.log('Response cookies after setAuthCookie:', response.cookies.getAll())
    console.log('Auth callback successful, redirecting to:', finalRedirectUrl)
    
    return response
    
  } catch (error) {
    console.error('Auth callback unexpected error:', error)
    const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/login?error=unexpected_error', baseUrl)
    )
  }
}

/**
 * 处理 POST 请求（某些 OAuth 提供商可能使用 POST）
 */
export async function POST(request: NextRequest) {
  return GET(request)
}