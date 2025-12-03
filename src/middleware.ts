import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers' // Importa a função cookies

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Passa o cookieStore para o createClient
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 2. Pega o usuário
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = pathname === '/admin/login'

  if (!user && !isAuthPage) {
    // Se não logado e não está na pág de login, redireciona para login
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (user && isAuthPage) {
    // Se logado e tentando acessar a pág de login, redireciona para o QG
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Permite a passagem
  return NextResponse.next()
}

export const config = {
  // O matcher agora protege todas as rotas de admin
  matcher: ['/admin/:path*'],
}