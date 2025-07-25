import { NextRequest, NextResponse } from 'next/server'
import { validateSession, generateLoginUrl, refreshSession } from '@/lib/auth'

/**
 * ForwardAuth 验证接口
 * Traefik 会调用此接口验证用户认证状态
 * @param request - Next.js 请求对象
 * @returns 200 表示已认证，302 表示需要登录
 */
export async function GET(request: NextRequest) {
  try {
    // 获取原始请求的 URL
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const forwardedUri = request.headers.get('x-forwarded-uri') || '/'
    
    let originalUrl = request.url
    if (forwardedHost) {
      originalUrl = `${forwardedProto}://${forwardedHost}${forwardedUri}`
    }
    
    console.log('ForwardAuth request for:', originalUrl)
    
    // 验证会话
    const sessionData = await validateSession(request)
    
    if (sessionData) {
      // 用户已认证，返回 200 并传递用户信息
      const response = NextResponse.next()
      
      // 设置用户信息头部，供后端应用使用
      response.headers.set('X-User-Id', sessionData.user.id)
      response.headers.set('X-User-Email', sessionData.user.email || '')
      response.headers.set('X-User-Name', sessionData.user.user_metadata?.name || '')
      
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      })
    }
    
    // 尝试刷新会话
    const refreshToken = request.cookies.get('sb-refresh-token')?.value
    if (refreshToken) {
      const newSession = await refreshSession(refreshToken)
      if (newSession) {
        const response = NextResponse.next()
        
        // 设置新的认证 Cookie
        response.cookies.set('sb-access-token', newSession.access_token, {
          domain: process.env.COOKIE_DOMAIN || '.mydomain.com',
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'lax',
          maxAge: newSession.expires_in
        })
        
        // 设置用户信息头部
        response.headers.set('X-User-Id', newSession.user.id)
        response.headers.set('X-User-Email', newSession.user.email || '')
        response.headers.set('X-User-Name', newSession.user.user_metadata?.name || '')
        
        return new NextResponse(null, {
          status: 200,
          headers: response.headers
        })
      }
    }
    
    // 用户未认证，重定向到登录页
    const loginUrl = generateLoginUrl(originalUrl)
    
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': loginUrl
      }
    })
    
  } catch (error) {
    console.error('ForwardAuth error:', error)
    
    // 发生错误时重定向到登录页
    const loginUrl = generateLoginUrl(request.url)
    
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': loginUrl
      }
    })
  }
}

/**
 * 健康检查接口
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}