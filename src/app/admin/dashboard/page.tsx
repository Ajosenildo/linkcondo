import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import Link from 'next/link' // Importa o Link para navegação

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Proteção (verifica se o usuário está logado)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/admin/login')
  }

  // 2. Renderiza a página
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full p-4 bg-white shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Painel do Administrador
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
          
          {/* Cartão de Boas-vindas */}
          <div className="p-6 bg-white rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Olá, Administrador!
            </h2>
            <p className="text-gray-600">
              Este é o seu painel de controle. Use os links abaixo para gerenciar o sistema.
            </p>
          </div>
          
          {/* --- ALTERAÇÃO AQUI --- */}
          {/* Seção de Gerenciamento (AGORA SÓ COM CLIENTES) */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Gerenciamento
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Link da Fase 2 (Clientes) */}
              <Link 
                href="/admin/clientes" 
                className="px-5 py-3 text-center font-medium text-white bg-green-600 rounded-md hover:bg-green-700 w-full sm:w-auto transition-colors"
              >
                Gerenciar Clientes (Fase 2)
              </Link>
              
              {/* --- BOTÃO AZUL REMOVIDO --- */}

            </div>
          </div>
          {/* --- FIM DA ALTERAÇÃO --- */}

        </div>
      </main>
    </div>
  )
}