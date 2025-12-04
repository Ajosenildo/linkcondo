import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Apenas permite que a requisição continue normalmente
  return NextResponse.next()
}

export const config = {
  // Aplica este middleware a todas as rotas, exceto arquivos estáticos
  matcher: '/:path*',
}