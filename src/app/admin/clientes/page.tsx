import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '../dashboard/LogoutButton'
import ClientManager from './ClientManager'
import Link from 'next/link'
import { cookies } from 'next/headers' // Importa a função cookies

export default async function ClientesPage() {
  // 1. Passa o cookieStore para o createClient
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 2. Proteção: Garante que o admin está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/admin/login')
  }

  // 3. Busca a lista inicial de clientes (administradoras)
  // Agora isso usará a política de RLS que criamos (só auth pode ler)
  const { data: clientes, error } = await supabase
    .from('administradoras')
    .select('*')
    .order('nome_empresa', { ascending: true })

  if (error) {
    console.error("Erro ao buscar clientes (verifique a política RLS):", error.message)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header do Admin */}
      <header className="w-full p-4 bg-white shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            <Link href="/admin/dashboard" className="hover:underline">Painel do Administrador</Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900">Clientes</span>
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
          <ClientManager initialClientes={clientes || []} />
        </div>
      </main>
    </div>
  )
}