import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from './supabase-server'
import Cookies from 'js-cookie'

/**
 * 验证用户会话
 * @param request - Next.js 请求对象
 * @returns 用户信息或 null
 */
export async function validateSession(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    return {
      user: session.user,
      session: session
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

/**
 * 设置认证 Cookie
 * @param response - Next.js 响应对象
 * @param session - Supabase 会话对象
 */
export function setAuthCookie(response: NextResponse, session: any) {
  const isSecure = process.env.NODE_ENV === 'production'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  
  // 设置 Supabase 标准 cookies
  response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user
  }), {
    httpOnly: false, // Supabase 客户端需要能够读取这个 cookie
    secure: isSecure,
    sameSite: 'lax',
    maxAge: session.expires_in,
    path: '/'
  })
}

/**
 * 清除认证 Cookie
 * @param response - Next.js 响应对象
 */
export function clearAuthCookie(response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  
  // 清除 Supabase 标准 cookie
  response.cookies.set(`sb-${projectRef}-auth-token`, '', {
    maxAge: 0,
    path: '/'
  })
}

/**
 * 刷新用户会话
 * @param refreshToken - 刷新令牌
 * @returns 新的会话信息或 null
 */
export async function refreshSession(refreshToken: string) {
  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })
    
    if (error || !data.session) {
      return null
    }
    
    return data.session
  } catch (error) {
    console.error('Session refresh error:', error)
    return null
  }
}

/**
 * 生成登录重定向 URL
 * @param originalUrl - 原始请求 URL
 * @returns 登录页面 URL
 */
export function generateLoginUrl(originalUrl: string): string {
  const loginUrl = new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000')
  loginUrl.searchParams.set('redirect', originalUrl)
  return loginUrl.toString()
}

/**
 * 验证重定向 URL 是否安全
 * @param url - 重定向 URL
 * @returns 是否安全
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const redirectUrl = new URL(url)
    const allowedDomains = ['mydomain.com', 'localhost']
    
    return allowedDomains.some(domain => 
      redirectUrl.hostname === domain || 
      redirectUrl.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}