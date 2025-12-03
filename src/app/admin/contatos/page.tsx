import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '../dashboard/LogoutButton'
import ContactManager from './ContactManager' // <-- Este arquivo criaremos no PASSO 4
import Link from 'next/link'
import { cookies } from 'next/headers'

// Define a interface para os dados do Contato (para o Server Component)
export interface ContatoJuridico {
  id: number
  created_at: string
  id_condominio: string | null
  name: string | null
  email: string | null
  phone: string | null
}


export default async function ContatosPage() {
  // 1. Pega o cookieStore (padrão de segurança que corrigimos)
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 2. Proteção: Garante que o admin está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/admin/login')
  }

  // 3. Busca a lista inicial de contatos
  // (Usando a política de RLS que criamos no Passo 1)
  const { data: contatos, error } = await supabase
    .from('contatos_juridicos')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error("Erro ao buscar contatos (verifique a política RLS):", error.message)
    // Não quebra a página, apenas loga o erro
  }

  // 4. Renderiza a página
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* Header do Admin */}
      <header className="w-full p-4 bg-white shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            <Link href="/admin/dashboard" className="hover:underline">Painel do Administrador</Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900">Contatos Jurídicos</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          {/* O Componente (que criaremos a seguir) com o formulário e a lista */}
          <ContactManager initialContatos={contatos || []} />
        </div>
      </main>
    </div>
  )
}