import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type cookies } from 'next/headers' // Importa o TIPO, não a função

// Define o tipo do cookieStore para ser passado
type CookieStore = ReturnType<typeof cookies>

// A FUNÇÃO createClient AGORA RECEBE o cookieStore
export function createClient(cookieStore: CookieStore) {

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 'get' agora usa o cookieStore que foi passado
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // O set pode falhar em Server Actions ou Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // O remove pode falhar em Server Actions ou Route Handlers
          }
        },
      },
    }
  )
}