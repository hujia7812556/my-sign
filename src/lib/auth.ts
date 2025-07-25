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
  
  // 获取 Cookie 域名配置
  const cookieDomain = process.env.COOKIE_DOMAIN || '.localhost'
  
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
    path: '/',
    domain: cookieDomain // 设置域名以支持跨子域名访问
  })
}

/**
 * 清除认证 Cookie
 * @param response - Next.js 响应对象
 */
export function clearAuthCookie(response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  
  // 获取 Cookie 域名配置
  const cookieDomain = process.env.COOKIE_DOMAIN || '.localhost'
  
  // 清除 Supabase 标准 cookie
  response.cookies.set(`sb-${projectRef}-auth-token`, '', {
    maxAge: 0,
    path: '/',
    domain: cookieDomain // 确保清除时使用相同的域名
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
  // 从环境变量获取配置的 URL
  const baseUrl = process.env.NEXT_APP_URL || 'http://localhost:3000'
  const loginUrl = new URL('/login', baseUrl)
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
    
    // 从环境变量获取允许的域名列表
    const allowedDomainsStr = process.env.ALLOWED_DOMAINS || 'localhost'
    const allowedDomains = allowedDomainsStr.split(',').map(domain => domain.trim())

    return allowedDomains.some(domain => {
      // 处理通配符域名 (*.domain.com)
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2) // 移除 '*.' 前缀
        return redirectUrl.hostname === baseDomain || 
               redirectUrl.hostname.endsWith(`.${baseDomain}`)
      }
      
      // 处理普通域名
      return redirectUrl.hostname === domain || 
             redirectUrl.hostname.endsWith(`.${domain}`)
    })
  } catch {
    return false
  }
}