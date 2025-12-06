// ARQUIVO: src/app/admin/dashboard/update-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Lock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Verifica se o usuário chegou aqui autenticado (pelo link mágico)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMsg('Erro: Link inválido ou expirado. Solicite novamente.')
      }
    }
    checkSession()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      // Atualiza a senha do usuário LOGADO
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
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2 ${msg.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {msg.includes('sucesso') ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
              <span>{msg.replace('sucesso: ', '').replace('Erro: ', '')}</span>
            </div>
          )}

          <button 
            disabled={loading || msg.includes('inválido')}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Salvando...' : 'Salvar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}