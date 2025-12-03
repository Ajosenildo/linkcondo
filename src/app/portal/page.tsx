'use client'
// ARQUIVO FINAL (V4): src/app/portal/page.tsx
// ATUALIZADO: Garante que o botão "Sair" apareça em TODOS os estados (Carregando, Erro, Lista).

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import jwt from 'jsonwebtoken'
import ReservasContent from './ReservasContent' 

// --- Interfaces ---
interface BoletoInfo {
  id: string
  vencimento: string
  valor: string
  linkPDF?: string
  idCondominio: string
}
interface LegalContact {
  name?: string
  phone?: string
  email?: string
}
interface GroupedResult {
  condominio: string
  unidade: string
  boletosVisiveis: BoletoInfo[]
  possuiDividaAntiga: boolean
  contatoJuridico?: LegalContact
}
interface DecodedToken {
  unidades: any[]
  subdomain: string
  acao: 'boletos' | 'reservas' 
}

// ====================================================================
// --- COMPONENTE DE BOLETOS ---
// ====================================================================
function BoletosContent({ token }: { token: string }) {
  const router = useRouter(); 

  const [groupedData, setGroupedData] = useState<GroupedResult[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalUrl, setModalUrl] = useState<string | null>(null)
  const [loadingModal, setLoadingModal] = useState(false)

  const handleLogout = () => {
    router.push('/?logout=true');
  }

  const handleVerCobranca = async (boleto: BoletoInfo) => {
    setLoadingModal(true)
    setError('')
    try {
      const response = await fetch('/api/obter-link-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCondominio: boleto.idCondominio,
          idBoleto: boleto.id,
          vencimento: boleto.vencimento,
          token: token, 
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.linkPDF) {
        throw new Error(data.error || 'Não foi possível obter o link da cobrança.')
      }
      setModalUrl(data.linkPDF)
    } catch (err: any) {
      const errorMessage = `Erro ao carregar cobrança: ${err.message}`
      setError(errorMessage)
    } finally {
      setLoadingModal(false)
    }
  }

  useEffect(() => {
    const fetchBoletos = async (token: string) => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/obter-boletos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }), 
        })

        if (!response.ok) {
          let errorData = { error: 'Erro desconhecido.' }
          try {
            errorData = await response.json()
          } catch (parseError) { /* ignora */ }
          
          if (response.status === 401) {
            setError('Sessão expirada.')
            return
          }
          throw new Error(errorData.error)
        }

        const data = await response.json()
        setGroupedData(data.groupedResults || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchBoletos(token)
    }
  }, [token]) 

  // --- Renderização (JSX) ---

  // 1. Estado de Carregamento (Com botão Sair)
  if (loading) {
    return (
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md text-center relative">
         <div className="absolute top-4 right-4 z-10">
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sair</button>
         </div>
         <p className="text-gray-700">Carregando seus boletos...</p>
      </div>
    )
  }
  
  const hasVisibleBoletos = groupedData.some(g => g.boletosVisiveis.length > 0)
  const hasAnyOldDebt = groupedData.some(g => g.possuiDividaAntiga)

  // 2. Estado de Erro ou Vazio (Com botão Sair)
  if (!loading && (error || (!hasVisibleBoletos && !hasAnyOldDebt))) {
    return (
       <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md text-center relative">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sair</button>
          </div>
          {error ? (
             <p className="text-red-500 font-semibold">{error}</p>
          ) : (
             <>
               <h1 className="text-2xl font-bold text-center text-gray-800">Seus Boletos</h1>
               <p className="text-gray-600">Nenhum boleto em aberto (vencendo nos próximos 30 dias ou vencido há menos de 60 dias) encontrado.</p>
             </>
          )}
       </div>
    )
  }

  // 3. Estado Principal (Lista de Boletos)
  return (
    <>
      <div className="w-full max-w-2xl p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-md relative">
        
        {/* Botão Sair */}
        <div className="absolute top-4 right-4 z-10">
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sair</button>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Consulta de Boletos</h1>
        
        {groupedData.map((grupo, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">{grupo.condominio} / {grupo.unidade}</h2>
            {grupo.boletosVisiveis.length > 0 ? (
              grupo.boletosVisiveis.map(boleto => (
                <div key={boleto.id} className="p-4 border rounded-md space-y-2 mb-3 last:mb-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                      <p className="text-gray-800"><strong>Vencimento:</strong> {boleto.vencimento}</p>
                      <p className="text-gray-800"><strong>Valor:</strong> {boleto.valor}</p>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        "Após clicar em ver cobrança, você poderá copiar o código de barra para colar no aplicativo do seu banco ou baixar o boleto para pagamento".
                      </p>
                    </div>
                    <button onClick={() => handleVerCobranca(boleto)} disabled={loadingModal}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap w-full sm:w-auto">
                      {loadingModal ? 'Carregando...' : 'Ver Cobrança'}
                    </button>
                  </div>
                </div>
              ))
            ) : (!grupo.possuiDividaAntiga && <p className="text-sm text-gray-500 italic">Nenhum boleto recente ou a vencer encontrado.</p>)}
            {grupo.possuiDividaAntiga && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
                <p className="font-semibold">Atenção:</p>
                <p>Existem pendências com mais de 60 dias de atraso para esta unidade.</p>
                {grupo.contatoJuridico ? (
                  <div className="mt-2">
                    <p>Por favor, entre em contato para regularização:</p>
                    {grupo.contatoJuridico.name && <p><strong>{grupo.contatoJuridico.name}</strong></p>}
                    {grupo.contatoJuridico.phone && <p>Telefone: {grupo.contatoJuridico.phone}</p>}
                    {grupo.contatoJuridico.email && <p>Email: {grupo.contatoJuridico.email}</p>}
                  </div>
                ) : (<p className="mt-2">Entre em contato com a administradora.</p>)}
              </div>
            )}
          </div>
        ))}
      </div>
      {modalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] sm:h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <button onClick={() => setModalUrl(null)} className="text-blue-600 hover:text-blue-800 font-semibold">Voltar</button>
              <h2 className="text-lg font-semibold text-gray-800">Detalhes da Cobrança</h2>
              <button onClick={() => setModalUrl(null)} className="text-2xl font-bold text-gray-600 hover:text-black">&times;</button>
            </div>
            <iframe src={modalUrl} className="w-full h-full border-none" title="Detalhes da Cobrança"></iframe>
          </div>
        </div>
      )}
    </>
  )
}


// ====================================================================
// --- COMPONENTE ROTEADOR ---
// ====================================================================
function PortalContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [acao, setAcao] = useState<'boletos' | 'reservas' | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const isTokenProcessed = useRef(false)

  useEffect(() => {
    if (isTokenProcessed.current) return;

    const tokenDaUrl = searchParams.get('token')

    if (tokenDaUrl) {
      try {
        const decoded = jwt.decode(tokenDaUrl) as DecodedToken
        
        if (!decoded || !decoded.unidades || !decoded.subdomain || !decoded.acao) {
          throw new Error('Token malformado ou faltando ação.')
        }

        setAuthToken(tokenDaUrl)
        setAcao(decoded.acao)
        router.replace(pathname, { scroll: false })
        
        isTokenProcessed.current = true
        setLoading(false)

      } catch (err) {
        router.push('/?error=invalid_token')
      }
    } else {
      router.push('/?error=missing_token')
    }
  }, [router, pathname, searchParams]) 

  
  if (loading) {
    return <p className="text-center text-gray-700 p-10">Validando seu acesso...</p>
  }

  if (acao === 'boletos' && authToken) {
    return <BoletosContent token={authToken} />
  }
  
  if (acao === 'reservas' && authToken) {
    return <ReservasContent token={authToken} />
  }

  return <p className="text-center text-red-500 p-10">Ocorreu um erro ao carregar o portal.</p>
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Carregando...</p></div>}>
      <main className="flex min-h-screen flex-col items-center justify-start py-10 px-4 bg-gray-50">
        <PortalContent />
      </main>
    </Suspense>
  )
}