'use client'
// ESTE ARQUIVO ESTÁ 100% COMPLETO
// Adiciona o texto de instrução abaixo do "Valor"
// E corrige o bug do loop infinito de redirect

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import jwt from 'jsonwebtoken'

// --- Interfaces (Sem alteração) ---
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
}

function BoletosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() // <-- Para limpar a URL

  // --- Estados (Com a adição do authToken) ---
  const [groupedData, setGroupedData] = useState<GroupedResult[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalUrl, setModalUrl] = useState<string | null>(null)
  const [loadingModal, setLoadingModal] = useState(false)
  
  // O "token escondido" que não fica na URL
  const [authToken, setAuthToken] = useState<string | null>(null)
  
  // Flag para corrigir o loop infinito do useEffect
  // Usamos useRef para garantir que o valor persista entre re-renderizações
  const isTokenProcessed = useRef(false)

  // 1. Função de buscar os boletos (Agora recebe o token)
  const fetchBoletos = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/obter-boletos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }), // Envia o token
      })

      if (!response.ok) {
        let errorData = { error: 'Erro desconhecido.' }
        try {
          errorData = await response.json()
        } catch (parseError) { /* ignora */ }
        
        if (response.status === 401) {
          // Token expirado ou inválido verificado pelo backend
          router.push('/?error=invalid_token')
          return
        }
        throw new Error(errorData.error)
      }

      const data = await response.json()
      setGroupedData(data.groupedResults || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erro ao buscar boletos:', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Função de ver cobrança (Agora usa o token do estado)
  const handleVerCobranca = async (boleto: BoletoInfo) => {
    setLoadingModal(true)
    setError('')
    
    if (!authToken) {
      setError('Erro: Autenticação perdida. Por favor, solicite um novo link.')
      setLoadingModal(false)
      return
    }

    try {
      const response = await fetch('/api/obter-link-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCondominio: boleto.idCondominio,
          idBoleto: boleto.id,
          vencimento: boleto.vencimento,
          token: authToken, // Envia o token "escondido"
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
      console.error(errorMessage)
    } finally {
      setLoadingModal(false)
    }
  }

  // 3. Efeito principal (Lógica da URL Limpa - CORRIGIDA)
  useEffect(() => {
    // Se já processamos o token uma vez, não faz mais nada.
    if (isTokenProcessed.current) {
      return;
    }

    const tokenDaUrl = searchParams.get('token')

    if (tokenDaUrl) {
      // Token encontrado na URL
      try {
        // Validação inicial (só formato)
        const decoded = jwt.decode(tokenDaUrl) as DecodedToken
        if (!decoded || !decoded.unidades) {
          throw new Error('Token malformado.')
        }

        // 1. "Esconde" o token no estado
        setAuthToken(tokenDaUrl)

        // 2. Limpa a URL (remove o token)
        router.replace(pathname, { scroll: false })

        // 3. Busca os boletos com o token
        fetchBoletos(tokenDaUrl)
        
        // 4. Marca como processado para evitar o loop
        isTokenProcessed.current = true;

      } catch (err) {
        // Token inválido (formato)
        router.push('/?error=invalid_token')
        isTokenProcessed.current = true; // Marca como processado para não dar loop
      }
    } else {
      // Token não está na URL
      // Redireciona imediatamente
      router.push('/?error=missing_token')
      isTokenProcessed.current = true; // Marca como processado para não dar loop
    }
    
    // Usamos um array de dependências vazio [] para garantir
    // que este useEffect rode APENAS UMA VEZ quando o componente montar.
  }, []) // <-- ARRAY DE DEPENDÊNCIAS VAZIO É A SOLUÇÃO

  // --- Renderização (JSX) ---

  if (loading) {
    return <p className="text-center text-gray-700 p-10">Carregando seus boletos...</p>
  }

  // O resto do arquivo é idêntico...
  const hasVisibleBoletos = groupedData.some(g => g.boletosVisiveis.length > 0)
  const hasAnyOldDebt = groupedData.some(g => g.possuiDividaAntiga)

  if (!loading && error && !hasVisibleBoletos && !hasAnyOldDebt) {
    return <p className="text-center text-red-500 font-semibold">{error}</p>
  }

  if (!loading && !error && !hasVisibleBoletos && !hasAnyOldDebt) {
    return (
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-center text-gray-800">Seus Boletos</h1>
        <p className="text-gray-600">Nenhum boleto em aberto (vencendo nos próximos 30 dias ou vencido há menos de 60 dias) encontrado para as unidades associadas ao seu e-mail.</p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-2xl p-4 md:p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Consulta de Boletos</h1>
        {error && <p className="text-center text-red-500 font-semibold mb-4">{error}</p>}

        {groupedData.map((grupo, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
              Condomínio: {grupo.condominio} <br className="sm:hidden" />
              <span className="font-normal">Unidade: {grupo.unidade}</span>
            </h2>

            {grupo.boletosVisiveis.length > 0 ? (
              grupo.boletosVisiveis.map(boleto => (
                <div key={boleto.id} className="p-4 border rounded-md space-y-2 mb-3 last:mb-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                      <p className="text-gray-800"><strong>Vencimento:</strong> {boleto.vencimento}</p>
                      <p className="text-gray-800"><strong>Valor:</strong> {boleto.valor}</p>
                      
                      {/* --- ESTA É A ADIÇÃO (com seu texto exato) --- */}
                      <p className="text-xs text-gray-500 mt-2 italic">
                        "Após clicar em ver cobrança, você poderá copiar o código de barra para colar no aplicativo do seu banco ou baixar o boleto para pagamento".
                      </p>
                      {/* --- FIM DA ADIÇÃO --- */}

                    </div>
                    <button
                      onClick={() => handleVerCobranca(boleto)}
                      disabled={loadingModal}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap w-full sm:w-auto"
                    >
                      {loadingModal ? 'Carregando...' : 'Ver Cobrança'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              !grupo.possuiDividaAntiga && <p className="text-sm text-gray-500 italic">Nenhum boleto recente ou a vencer encontrado para esta unidade.</p>
            )}

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
                ) : (
                  <p className="mt-2">Entre em contato com a administradora para mais informações.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL (Sem alteração) */}
      {modalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] sm:h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <button
                onClick={() => setModalUrl(null)}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mr-2 sm:mr-4 text-sm sm:text-base"
              >
                Voltar
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-center flex-grow truncate">Detalhes da Cobrança</h2>
              <button onClick={() => setModalUrl(null)} className="text-xl sm:text-2xl font-bold text-gray-600 hover:text-black ml-2 sm:ml-4">&times;</button>
            </div>
            <iframe src={modalUrl} className="w-full h-full border-none" title="Detalhes da Cobrança"></iframe>
          </div>
        </div>
      )}
    </>
  )
}

// Componente principal que usa Suspense (Sem alteração)
export default function BoletosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Carregando...</p></div>}>
      <main className="flex min-h-screen flex-col items-center justify-start py-10 px-4 bg-gray-50">
        <BoletosContent />
      </main>
    </Suspense>
  )
}