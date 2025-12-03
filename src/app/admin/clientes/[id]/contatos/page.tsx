import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/app/admin/dashboard/LogoutButton'
import Link from 'next/link'
import { cookies } from 'next/headers' // <-- Importa o cookies()
import { ContactManager } from './ContactManager'

// Define a interface para os dados do Contato
export interface ContatoJuridico {
  id: number
  created_at: string
  id_condominio: string | null
  name: string | null
  email: string | null
  phone: string | null
  administradora_id: number | null
}

// Esta página recebe 'params' porque está em uma rota dinâmica [id]
export default async function ContatosPorClientePage({ params }: { params: { id: string } }) {
  
  // --- INÍCIO DA CORREÇÃO ---
  // 1. Pega o cookieStore (assíncrono)
  const cookieStore = cookies()
  // 2. Passa o cookieStore para o createClient
  const supabase = createClient(cookieStore)
  // --- FIM DA CORREÇÃO ---

  // 1. Proteção: Garante que o admin está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/admin/login')
  }

  // 2. Busca o ID da administradora pela URL
  const administradoraId = params.id // <-- Agora funciona, pois o cookie foi lido antes

  // 3. Busca os dados da Administradora (para sabermos o nome)
  const { data: administradora, error: adminError } = await supabase
    .from('administradoras')
    .select('nome_empresa')
    .eq('id', administradoraId)
    .single()

  // 4. Busca os contatos jurídicos APENAS desta administradora
  const { data: contatos, error: contatosError } = await supabase
    .from('contatos_juridicos')
    .select('*')
    .eq('administradora_id', administradoraId) // <-- A MÁGICA (o "link" do Passo 1)
    .order('name', { ascending: true })

  if (adminError || contatosError) {
    console.error("Erro ao buscar dados de contatos:", adminError?.message || contatosError?.message)
    // (Não redireciona, apenas mostra a página de erro ou vazia)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* Header do Admin */}
      <header className="w-full p-4 bg-white shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 truncate">
            {/* Navegação "Breadcrumb" */}
            <Link href="/admin/dashboard" className="hover:underline">Painel</Link>
            <span className="text-gray-400 mx-2">/</span>
            <Link href="/admin/clientes" className="hover:underline">Clientes</Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900">Contatos</span>
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
          {/* Passamos o ID da administradora e os contatos para ele */}
          <ContactManager 
            administradoraId={parseInt(administradoraId)} 
            administradoraNome={administradora?.nome_empresa || 'Cliente Desconhecido'}
            initialContatos={contatos || []} 
          />
        </div>
      </main>
    </div>
  )
}