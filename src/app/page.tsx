'use client'
// ARQUIVO: src/app/page.tsx
// CORRIGIDO: Removemos o import errado do ReservasContent.

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import HomePageContent from '@/components/HomePageContent'

interface TenantData {
  nome_empresa?: string
  logo_url?: string
  email_contato?: string;
  telefone_contato?: string;
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const errorParam = searchParams.get('error')
  const logoutParam = searchParams.get('logout')

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [tenantLoading, setTenantLoading] = useState(true)

  const [acao, setAcao] = useState<'boletos' | 'reservas'>('boletos')

  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (logoutParam === 'true') {
        setSuccessMessage('Você saiu do sistema com segurança.');
        router.replace(pathname, { scroll: false });
    }

    if (errorParam === 'missing_token') {
      setRedirectMessage('Link inválido. Por favor, solicite um novo link.')
      router.replace(pathname, { scroll: false })
    } else if (errorParam === 'invalid_token') {
      setRedirectMessage('Seu link de acesso expirou ou é inválido. Por favor, solicite um novo.')
      router.replace(pathname, { scroll: false })
    }

    const hostname = window.location.hostname
    const parts = hostname.split('.')
    let detectedSubdomain: string | null = null

    if (parts.length >= 2) {
      if (parts[0] !== 'www' && parts[0] !== 'localhost') {
        detectedSubdomain = parts[0]
      }
    }
    if (hostname.includes('.localhost')) {
        detectedSubdomain = parts[0];
    }
    if (hostname === 'localhost') {
        detectedSubdomain = null;
    }

    if (detectedSubdomain) {
      setSubdomain(detectedSubdomain)
      
      const fetchTenantData = async (sub: string) => {
        setTenantLoading(true)
        try {
          const response = await fetch(`/api/public/tenant/${sub}`)
          if (!response.ok) {
            setTenantData(null)
            return
          }
          const data: TenantData = await response.json()
          setTenantData(data)
        } catch (err) {
          setTenantData(null)
        } finally {
          setTenantLoading(false)
        }
      }
      fetchTenantData(detectedSubdomain)

    } else {
      setTenantLoading(false)
      setMessage('Erro: Não foi possível identificar a administradora.')
    }
    
  }, []) 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setRedirectMessage('') 
    setSuccessMessage('')

    try {
      const response = await fetch('/api/solicitar-link', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          subdomain, 
          acao: acao 
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ocorreu um erro.')
      setMessage(data.message)
      setEmail('')
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      
      {tenantLoading ? (
        <div className="h-20 w-full animate-pulse bg-gray-200 rounded-md mb-4"></div>
      ) : (
        tenantData?.logo_url && (
          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <Image
              src={tenantData.logo_url}
              alt={tenantData.nome_empresa || 'Logo da Administradora'}
              width={180} height={60}
              style={{ objectFit: 'contain' }}
              priority
            />
            {tenantData.nome_empresa && (
              <h1 className="text-xl font-semibold text-center text-gray-700">
                {tenantData.nome_empresa}
              </h1>
            )}
            {/* AQUI ESTÁ O CÓDIGO PARA MOSTRAR OS CONTATOS */}
            {(tenantData.email_contato || tenantData.telefone_contato) && (
              <div className="text-center text-xs text-gray-500 mt-1">
                {tenantData.email_contato && <p>📧 {tenantData.email_contato}</p>}
                {tenantData.telefone_contato && <p>📞 {tenantData.telefone_contato}</p>}
              </div>
            )}
          </div>
        )
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded text-center text-sm font-medium">
          {successMessage}
        </div>
      )}

      {redirectMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center text-sm">
          {redirectMessage}
        </div>
      )}

      {!tenantData?.nome_empresa && (
         <h1 className="text-2xl font-bold text-center text-gray-800">2ª Via de Boleto</h1>
      )}
      <p className="text-center text-gray-600">
        Digite seu e-mail cadastrado na administradora para validar seu acesso.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">O que você deseja fazer?</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setAcao('boletos')}
              className={`px-4 py-2 border-y border-l rounded-l-md w-1/2 text-sm font-medium transition-colors ${
                acao === 'boletos'
                  ? 'bg-blue-600 text-white border-blue-700 z-10'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Ver Boletos
            </button>
            <button
              type="button"
              onClick={() => setAcao('reservas')}
              className={`px-4 py-2 border rounded-r-md w-1/2 text-sm font-medium transition-colors ${
                acao === 'reservas'
                  ? 'bg-blue-600 text-white border-blue-700 z-10'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Fazer Reserva
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">Seu E-mail</label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            required
            className="mt-1 w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !subdomain}
          className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Validando...' : 'Receber validação'}
        </button>
      </form>
      
      {message && (
        <p className={`mt-4 text-center text-sm font-medium ${message.startsWith('Erro:') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Suspense fallback={<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md animate-pulse">Carregando...</div>}>
        <HomePageContent />
      </Suspense>
    </main>
  )
}