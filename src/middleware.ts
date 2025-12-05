import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // 1. Defina o seu domínio principal (ajuste quando tiver o domínio final)
  // No localhost é 'localhost:3000', na Vercel é o seu link '.vercel.app'
  const isLocal = hostname.includes('localhost')
  const rootDomain = isLocal ? 'localhost:3000' : 'linkcondo.iadev.app' // Substitua pelo seu domínio real se tiver

  // 2. Identifica se é um subdomínio (ex: rezende.localhost)
  // Remove o domínio principal para sobrar só o "rezende"
  const currentHost = hostname.replace(`.${rootDomain}`, '').replace(`.${rootDomain.split(':')[0]}`, '')
  
  // Verifica se temos um subdomínio válido (que não seja o próprio domínio raiz nem www)
  const isSubdomain = hostname !== rootDomain && 
                      !hostname.includes('vercel.app') && // Ignora domínios padrão da Vercel para testes
                      currentHost !== 'www' && 
                      currentHost !== rootDomain

  // 3. SE for subdomínio, reescreve a rota
  if (isSubdomain) {
    // O usuário vê: rezende.site.com
    // O Next.js processa: /tenant/rezende (pasta que vamos criar)
    console.log(`Subdomínio detectado: ${currentHost}`)
    url.pathname = `/tenant/${currentHost}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Se não for subdomínio, segue normal (mostra a home page padrão)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Filtra para não rodar em arquivos estáticos (imagens, css, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}