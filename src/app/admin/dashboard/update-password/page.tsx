// ARQUIVO: src/app/admin/dashboard/update-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Lock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Mudança: começamos sem mensagem de erro, esperando a validação
  const [msg, setMsg] = useState('')
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // 1. Monitora a Sessão em tempo real
  useEffect(() => {
    // Escuta mudanças na autenticação (login, logout, recuperação)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de Auth:", event)
      
      if (session) {
        // Se tem sessão, está tudo certo!
        setVerificandoSessao(false)
        setMsg('') 
      } else {
        // Se não tem sessão após o carregamento inicial
        if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
           // Dá um tempinho extra antes de decretar erro (para evitar falso negativo)
           setTimeout(async () => {
             const { data } = await supabase.auth.getSession()
             if (!data.session) {
               setVerificandoSessao(false)
               setMsg('O link expirou ou é inválido. Por favor, solicite um novo.')
             }
           }, 1000)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMsg('sucesso: Senha atualizada! Redirecionando...')
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 2000)

    } catch (error: any) {
      setMsg(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Se ainda estiver verificando, mostra um loader em vez do erro
  if (verificandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-slate-400" size={32} />
          <p className="text-slate-500 text-sm">Validando seu acesso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-800 rounded-xl mx-auto flex items-center justify-center mb-3">
             <Lock className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Nova Senha</h1>
          <p className="text-slate-500 text-sm">Defina sua nova senha de acesso.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Digite a nova senha</label>
            <input 
              type="password" 
              required
              minLength={6}
              disabled={!!msg && !msg.includes('sucesso')} // Desabilita se tiver erro
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition disabled:bg-slate-50"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2 ${msg.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {msg.includes('sucesso') ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
              <span>{msg.replace('sucesso: ', '').replace('Erro: ', '')}</span>
            </div>
          )}

          <button 
            disabled={loading || (!!msg && !msg.includes('sucesso'))}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Salvando...' : 'Salvar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}