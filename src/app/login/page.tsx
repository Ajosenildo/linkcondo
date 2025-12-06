// ARQUIVO: src/app/login/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowRight, Mail, Loader2, Building2, CheckCircle, AlertCircle, FileText, CalendarDays, Phone, Globe } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TABELA_BANCO = 'administradoras'

// Interface atualizada com os contatos
interface DadosEmpresa {
  nome: string
  logo?: string
  subdominio: string
  email_contato?: string
  telefone_contato?: string
  site?: string
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const adminIdentifier = searchParams.get('admin') 
  
  const [email, setEmail] = useState('')
  const [acao, setAcao] = useState<'boletos' | 'reservas'>('boletos')
  
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [sucesso, setSucesso] = useState(false)
  const [erroApi, setErroApi] = useState('')
  
  const [empresa, setEmpresa] = useState<DadosEmpresa | null>(null)

  // 1. Carrega dados da empresa (Incluindo contatos)
  useEffect(() => {
    const carregarDadosEmpresa = async () => {
      if (!adminIdentifier) {
        setLoadingDados(false)
        return
      }

      try {
        // ADICIONADO: email_contato, telefone_contato, site no select
        const { data, error } = await supabase
          .from(TABELA_BANCO)
          .select('nome_empresa, logo_url, subdominio, email_contato, telefone_contato, site')
          .or(`subdominio.eq.${adminIdentifier},nome_empresa.eq.${adminIdentifier}`)
          .single()

        if (data) {
          setEmpresa({
            nome: data.nome_empresa,
            logo: data.logo_url,
            subdominio: data.subdominio,
            email_contato: data.email_contato,
            telefone_contato: data.telefone_contato,
            site: data.site
          })
        }
      } catch (error) {
        console.error("Erro ao carregar empresa:", error)
      } finally {
        setLoadingDados(false)
      }
    }

    carregarDadosEmpresa()
  }, [adminIdentifier])

  // 2. Função de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !empresa?.subdominio) return

    setLoading(true)
    setErroApi('')
    setSucesso(false)

    try {
      console.log(`Solicitando link (${acao}) para ${email} em ${empresa.subdominio}`)
      
      const response = await fetch('/api/solicitar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          subdomain: empresa.subdominio,
          acao: acao
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar acesso.')
      }

      setSucesso(true)
      setEmail('') 
      
    } catch (err: any) {
      setErroApi(err.message || 'Ocorreu um erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  const nomeExibicao = empresa?.nome || decodeURIComponent(adminIdentifier || 'Condomínio')

  // Tela de Sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifique seu e-mail</h2>
          <p className="text-slate-600 mb-6">
            Enviamos um link mágico para você acessar a área de <strong>{acao === 'boletos' ? 'Boletos' : 'Reservas'}</strong>.
          </p>
          <button onClick={() => setSucesso(false)} className="text-blue-600 font-semibold hover:underline">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative">
        
        {/* CABEÇALHO REORGANIZADO */}
        <div className="text-center mb-6">
          
          {/* 1. Texto acima da Logo (Solicitado) */}
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
            Acessando Área Restrita
          </h2>

          {/* 2. Logo no meio */}
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 overflow-hidden border border-slate-100 shadow-sm p-1">
             {loadingDados ? (
               <Loader2 className="animate-spin text-blue-600" />
             ) : empresa?.logo ? (
               <img src={empresa.logo} alt="Logo" className="w-full h-full object-contain rounded-full" />
             ) : (
               <Building2 className="text-blue-600" size={32} />
             )}
          </div>
          
          {/* 3. Nome da Empresa */}
          <h1 className="text-xl font-bold text-slate-900 leading-tight px-4">
            {loadingDados ? 'Carregando...' : nomeExibicao}
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* SELETOR DE AÇÃO */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 ml-1">
              O que você deseja acessar?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAcao('boletos')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  acao === 'boletos' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
                }`}
              >
                <FileText size={24} className="mb-2" />
                <span className="text-sm font-bold">Boletos</span>
              </button>

              <button
                type="button"
                onClick={() => setAcao('reservas')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  acao === 'reservas' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
                }`}
              >
                <CalendarDays size={24} className="mb-2" />
                <span className="text-sm font-bold">Reservas</span>
              </button>
            </div>
          </div>

          {/* INPUT EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
              Informe seu e-mail
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3.5 text-slate-500">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                required
                placeholder="seu@email.com" 
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {erroApi && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{erroApi}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || loadingDados || !empresa}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-70 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
          >
            {loading ? 'Enviando Link...' : 'Solicitar Acesso'} 
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        {/* --- NOVA ÁREA: CONTATOS DA ADMINISTRADORA --- */}
        {!loadingDados && empresa && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4">
              Contatos da Administradora
            </h3>
            
            <div className="space-y-3">
              {/* Telefone */}
              {empresa.telefone_contato && (
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <Phone size={16} className="text-blue-500" />
                  <span>{empresa.telefone_contato}</span>
                </div>
              )}
              
              {/* E-mail */}
              {empresa.email_contato && (
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <Mail size={16} className="text-blue-500" />
                  <span>{empresa.email_contato}</span>
                </div>
              )}

              {/* Site (Novo campo) */}
              {empresa.site && (
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <Globe size={16} className="text-blue-500" />
                  <a 
                    href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 hover:underline truncate"
                  >
                    {empresa.site}
                  </a>
                </div>
              )}
              
              {/* Fallback se não tiver nada */}
              {!empresa.telefone_contato && !empresa.email_contato && !empresa.site && (
                <p className="text-center text-xs text-slate-400 italic">
                  Nenhum contato cadastrado.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/acesso')}
            className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition"
          >
            Alterar Administradora
          </button>
        </div>

      </div>
    </div>
  )
}