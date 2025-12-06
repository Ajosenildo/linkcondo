// ARQUIVO: src/app/acesso/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// --- CONFIGURAÇÃO DO BANCO (BASEADO NO SEU JSON) ---
const TABELA_BANCO = 'administradoras'
const COLUNA_NOME = 'nome_empresa' // Coluna que guarda o nome para busca

// Interface tipada de acordo com o seu banco
interface Administradora {
  id: number
  nome_empresa: string
  subdominio: string
  logo_url?: string
}

export default function AcessoPage() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Administradora[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [erroBanco, setErroBanco] = useState('')

  useEffect(() => {
    const buscarAdministradoras = async () => {
      // Limpa se digitar menos de 2 letras
      if (busca.length < 2) {
        setResultados([])
        setShowDropdown(false)
        return
      }

      setLoading(true)
      setErroBanco('')

      try {
        console.log(`Buscando por "${busca}" em ${TABELA_BANCO}...`)

        // Busca no Supabase usando os campos corretos da sua tabela
        const { data, error } = await supabase
          .from(TABELA_BANCO) 
          .select('id, nome_empresa, subdominio, logo_url')
          .ilike(COLUNA_NOME, `%${busca}%`) // Busca parcial (ex: "reze" acha "Rezende")
          .limit(5)

        if (error) throw error

        console.log('Resultados:', data)
        setResultados(data || [])
        setShowDropdown(true)

      } catch (error: any) {
        console.error('Erro Supabase:', error.message)
        // Dica visual se for erro de permissão (RLS)
        if (error.code === '42501' || error.message?.includes('policy')) {
            setErroBanco('Erro de permissão: Verifique o RLS no Supabase.')
        } else {
            setErroBanco('Erro ao buscar administradora.')
        }
      } finally {
        setLoading(false)
      }
    }

    // Delay para não buscar a cada letra (Debounce)
    const delayDebounce = setTimeout(() => {
      buscarAdministradoras()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [busca])

  const selecionarAdministradora = (admin: Administradora) => {
    // Usa o subdominio (ex: 'rezende') para passar na URL
    // Se não tiver subdomínio, usa o nome da empresa
    const identificador = admin.subdominio || admin.nome_empresa
    console.log('Selecionado:', identificador)
    
    // Redireciona para o login
    router.push(`/login?admin=${encodeURIComponent(identificador)}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Building2 size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Acesse seu Condomínio</h1>
        <p className="text-center text-slate-500 mb-8">Digite o nome da sua administradora para continuar.</p>

        <div className="relative">
          <div className="absolute left-3 top-3.5 text-slate-500">
            <Search size={20} />
          </div>
          
          <input 
            type="text" 
            placeholder="Ex: Rezende" 
            className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          {loading && (
            <div className="absolute right-3 top-3.5 text-blue-600 animate-spin">
              <Loader2 size={20} />
            </div>
          )}

          {/* LISTA DE RESULTADOS */}
          {showDropdown && resultados.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
              {resultados.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => selecionarAdministradora(item)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-3 border-b last:border-none border-slate-50"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 overflow-hidden">
                      {item.logo_url ? (
                        <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.nome_empresa.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-800">{item.nome_empresa}</span>
                      {item.subdominio && <span className="text-xs text-slate-400">@{item.subdominio}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Mensagens de Estado */}
          {showDropdown && resultados.length === 0 && busca.length >= 2 && !loading && !erroBanco && (
            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 p-4 text-center text-sm text-slate-500 shadow-lg">
              Nenhuma administradora encontrada.
            </div>
          )}

           {erroBanco && (
            <div className="absolute z-10 w-full bg-red-50 border border-red-200 rounded-lg mt-1 p-3 flex items-center gap-2 text-sm text-red-600 shadow-lg">
              <AlertCircle size={16} />
              <span>{erroBanco}</span>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-slate-400 hover:text-blue-600 transition">
            Voltar para a Home
          </a>
        </div>
      </div>
    </div>
  )
}