// ARQUIVO: src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simplificação total: Não faz redirecionamentos complexos.
  // Apenas garante que o sistema flua normalmente.
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos para economizar processamento
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}