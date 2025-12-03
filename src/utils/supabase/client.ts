// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Esta função cria um cliente Supabase que pode ser usado DENTRO de Client Components.
// Ele usa as chaves PÚBLICAS (anon key) lidas das variáveis de ambiente.
export function createClient() {
  // Garante que as variáveis de ambiente públicas estão definidas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

   if (!supabaseUrl || !supabaseAnonKey) {
      console.error('!!! Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas !!!');
      // Pode ser útil lançar um erro ou retornar um estado inválido
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}