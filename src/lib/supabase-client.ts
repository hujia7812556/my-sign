import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

/**
 * 创建 Supabase 客户端实例
 * 用于客户端组件
 */
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 创建客户端组件 Supabase 客户端
 * 用于客户端组件
 */
export const createSupabaseComponentClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}