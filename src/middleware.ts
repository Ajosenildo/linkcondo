import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  
  // 1. Captura o Hostname (ex: rezende.linkcondo.app)
  const hostname = request.headers.get('host') || ''
  
  // 2. Define os domínios principais que NÃO são clientes
  // Ajuste conforme o seu domínio real na Vercel
  const currentHost = process.env.NODE_ENV === 'production'
    ? 'linkcondo.iadev.app' // Seu domínio de produção
    : 'localhost:3000'      // Seu ambiente local

  // 3. Verifica se é um subdomínio (ex: rezende)
  // Se o hostname for diferente do principal, assumimos que é um cliente
  const isSubdomain = hostname !== currentHost && !hostname.includes('vercel.app')

  if (isSubdomain) {
    // AQUI entra a mágica: Reescreve a URL internamente
    // O usuário vê "rezende.site.com", mas o Next.js carrega "/app/rezende"
    // ou passa o subdomínio via header.
    console.log(`Acesso via subdomínio: ${hostname}`)
    
    // Exemplo de Rewrite (opcional - ative se tiver lógica de pasta por tenant)
    // return NextResponse.rewrite(new URL(`/${hostname}${url.pathname}`, request.url))
  }

  return NextResponse.next()
}

// Configuração CRÍTICA para não bloquear CSS, Imagens e API
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}