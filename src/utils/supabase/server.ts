// src/utils/supabase/server.ts
// ATUALIZADO: Correção de tipagem para Next.js 15/16

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Recebe o cookieStore já aguardado (awaited)
export const createClient = (cookieStore: any) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // O método set foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver middleware.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // O método delete foi chamado de um Server Component.
          }
        },
      },
    }
  )
}