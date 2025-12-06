// ARQUIVO: src/app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('') // Mensagem de sucesso (novo)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const supabase = createClient()

  // Função de Login (Existente)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Previne recarregamento se vier do form
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/admin/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      setErrorMsg('Credenciais inválidas ou erro no servidor.')
      setLoading(false)
    }
  }

  // NOVA FUNÇÃO: Recuperar Senha
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Por favor, digite seu e-mail no campo acima para recuperar a senha.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Para onde o usuário vai após clicar no link do e-mail
        // Garanta que essa URL esteja em "Redirect URLs" no painel do Supabase
        redirectTo: `${window.location.origin}/admin/dashboard/update-password`,
      })

      if (error) throw error

      setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    } catch (error: any) {
      console.error(error)
      setErrorMsg('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        
        {/* CABEÇALHO */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform rotate-3 hover:rotate-0 transition">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso restrito à equipe LinkCondo</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
              E-mail Corporativo
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3.5 text-slate-400">
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition"
                placeholder="admin@linkcondo.com"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3.5 text-slate-400">
                <Lock size={20} />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition"
                placeholder="••••••••"
              />
            </div>
            {/* LINK ESQUECI A SENHA (NOVO) */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
              >
                <KeyRound size={12} />
                Esqueceu a senha?
              </button>
            </div>
          </div>

          {/* Mensagens de Feedback */}
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-green-100">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-70 shadow-lg hover:shadow-slate-500/30 transform hover:-translate-y-0.5"
          >
            {loading ? 'Processando...' : 'Acessar Painel'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
           <p className="text-xs text-slate-400">
             Problemas de acesso? Contate o suporte técnico.
           </p>
        </div>
      </div>
    </main>
  )
}