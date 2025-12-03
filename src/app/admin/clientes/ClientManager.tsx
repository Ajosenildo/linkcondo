// src/app/admin/clientes/ClientManager.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

// Define a interface para os dados da Administradora (agora com os contatos de suporte)
interface Administradora {
  id: number
  created_at: string
  nome_empresa: string | null
  subdominio: string | null
  // Tokens não são enviados para o frontend por segurança
  cnpj: string | null
  contato_cobranca_nome: string | null
  contato_cobranca_email: string | null
  contato_cobranca_telefone: string | null
  logo_url: string | null
  // --- NOVOS CAMPOS ---
  email_contato: string | null
  telefone_contato: string | null
}

// Define as props do componente, que recebe a lista inicial do servidor
interface ClientManagerProps {
  initialClientes: Administradora[]
}

export default function ClientManager({ initialClientes }: ClientManagerProps) {
  // --- ESTADOS DO FORMULÁRIO DE CRIAR ---
  const [clientes, setClientes] = useState(initialClientes)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Campos do formulário de *criar*
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [subdominio, setSubdominio] = useState('')
  const [tokenApp, setTokenApp] = useState('')
  const [tokenApi, setTokenApi] = useState('')
  const [cnpj, setCnpj] = useState('')
  
  const [contatoNome, setContatoNome] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')
  
  const [logoUrl, setLogoUrl] = useState('')

  // --- NOVOS ESTADOS (CRIAR) ---
  const [emailContato, setEmailContato] = useState('')
  const [telefoneContato, setTelefoneContato] = useState('')

  // --- ESTADOS DO MODAL DE EDITAR ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Administradora | null>(null)
  
  // Campos do formulário de *editar* (controlados separadamente)
  const [editNomeEmpresa, setEditNomeEmpresa] = useState('')
  const [editSubdominio, setEditSubdominio] = useState('')
  const [editCnpj, setEditCnpj] = useState('')
  const [editContatoNome, setEditContatoNome] = useState('')
  const [editContatoEmail, setEditContatoEmail] = useState('')
  const [editContatoTelefone, setEditContatoTelefone] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  
  // --- NOVOS ESTADOS (EDITAR) ---
  const [editEmailContato, setEditEmailContato] = useState('')
  const [editTelefoneContato, setEditTelefoneContato] = useState('')


  // --- FUNÇÕES ---

  // Função para limpar o formulário de *criar*
  const resetCreateForm = () => {
    setNomeEmpresa('')
    setSubdominio('')
    setTokenApp('')
    setTokenApi('')
    setCnpj('')
    setContatoNome('')
    setContatoEmail('')
    setContatoTelefone('')
    setLogoUrl('')
    setEmailContato('')
    setTelefoneContato('')
  }

  // 1. FUNÇÃO DE CRIAR (handleSubmit)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_empresa: nomeEmpresa,
          subdominio,
          token_superlogica_app: tokenApp,
          token_superlogica_api: tokenApi,
          cnpj,
          contato_cobranca_nome: contatoNome,
          contato_cobranca_email: contatoEmail,
          contato_cobranca_telefone: contatoTelefone,
          logo_url: logoUrl,
          // Novos campos
          email_contato: emailContato,
          telefone_contato: telefoneContato,
        }),
      })

      const novoCliente = await response.json()

      if (!response.ok) {
        throw new Error(novoCliente.error || 'Falha ao criar cliente')
      }

      // Sucesso! Adiciona o novo cliente à lista na tela
      setClientes([...clientes, novoCliente])
      setMessage('Cliente criado com sucesso!')
      resetCreateForm() // Limpa o formulário

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 2. FUNÇÃO DE ABRIR MODAL (handleEditClick)
  const handleEditClick = (cliente: Administradora) => {
    setSelectedClient(cliente)
    // Preenche os campos de edição com os dados do cliente
    setEditNomeEmpresa(cliente.nome_empresa || '')
    setEditSubdominio(cliente.subdominio || '')
    setEditCnpj(cliente.cnpj || '')
    setEditContatoNome(cliente.contato_cobranca_nome || '')
    setEditContatoEmail(cliente.contato_cobranca_email || '')
    setEditContatoTelefone(cliente.contato_cobranca_telefone || '')
    setEditLogoUrl(cliente.logo_url || '')
    // Novos campos
    setEditEmailContato(cliente.email_contato || '')
    setEditTelefoneContato(cliente.telefone_contato || '')
    
    setIsModalOpen(true)
  }

  // 3. FUNÇÃO DE EDITAR (handleUpdateSubmit)
  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedClient) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedClient.id,
          nome_empresa: editNomeEmpresa,
          subdominio: editSubdominio,
          cnpj: editCnpj,
          contato_cobranca_nome: editContatoNome,
          contato_cobranca_email: editContatoEmail,
          contato_cobranca_telefone: editContatoTelefone,
          logo_url: editLogoUrl,
          // Novos campos
          email_contato: editEmailContato,
          telefone_contato: editTelefoneContato,
        }),
      })

      const clienteAtualizado = await response.json()

      if (!response.ok) {
        throw new Error(clienteAtualizado.error || 'Falha ao atualizar cliente')
      }

      // Sucesso! Atualiza a lista de clientes na tela
      setClientes(
        clientes.map((c) =>
          c.id === clienteAtualizado.id ? clienteAtualizado : c
        )
      )
      setMessage('Cliente atualizado com sucesso!')
      setIsModalOpen(false) // Fecha o modal

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- RENDERIZAÇÃO (JSX) ---
  return (
    <div className="space-y-8">
      
      {/* 1. Formulário de ADICIONAR NOVO CLIENTE */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Adicionar Novo Cliente
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nomeEmpresa" className="block text-sm font-medium text-gray-700">
                * Nome da Empresa
              </label>
              <input
                type="text" id="nomeEmpresa" value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)} required
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="subdominio" className="block text-sm font-medium text-gray-700">
                * Subdomínio (ex: admina)
              </label>
              <input
                type="text" id="subdominio" value={subdominio}
                onChange={(e) => setSubdominio(e.target.value)} required
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="tokenApp" className="block text-sm font-medium text-gray-700">
                * Token App (Superlógica)
              </label>
              <input
                type="password" id="tokenApp" value={tokenApp}
                onChange={(e) => setTokenApp(e.target.value)} required
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••••••••"
              />
            </div>
            <div>
              <label htmlFor="tokenApi" className="block text-sm font-medium text-gray-700">
                * Token API (Superlógica)
              </label>
              <input
                type="password" id="tokenApi" value={tokenApi}
                onChange={(e) => setTokenApi(e.target.value)} required
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••••••••"
              />
            </div>
          </div>

          <hr className="my-6" />

          {/* Dados Visuais e Suporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                  URL do Logo (Público)
                </label>
                <input
                  type="text" id="logoUrl" value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://.../logo.png"
                />
             </div>
             <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                  CNPJ
                </label>
                <input
                  type="text" id="cnpj" value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
          </div>

          {/* --- NOVA SEÇÃO: Contato de Suporte --- */}
          <fieldset className="p-4 border border-blue-200 bg-blue-50 rounded-md">
            <legend className="text-sm font-medium text-blue-800 px-2 bg-blue-50 rounded">Contato de Suporte (Aparece no Login)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="emailContato" className="block text-sm font-medium text-gray-700">E-mail de Suporte</label>
                <input
                  type="email" id="emailContato" value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="suporte@empresa.com"
                />
              </div>
              <div>
                <label htmlFor="telefoneContato" className="block text-sm font-medium text-gray-700">Telefone de Suporte</label>
                <input
                  type="text" id="telefoneContato" value={telefoneContato}
                  onChange={(e) => setTelefoneContato(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
          </fieldset>
          
          {/* Seção Antiga: Contato de Cobrança */}
          <fieldset className="p-4 border rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-2">Contato de Cobrança (Opcional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label htmlFor="contatoNome" className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text" id="contatoNome" value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="contatoEmail" className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email" id="contatoEmail" value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="contatoTelefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text" id="contatoTelefone" value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Salvar Novo Cliente'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${message.startsWith('Erro:') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
      
      {/* 2. Tabela de CLIENTES CADASTRADOS */}
      <div className="p-6 bg-white rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Clientes Cadastrados
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome da Empresa</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subdomínio</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{cliente.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{cliente.nome_empresa || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 bg-gray-50">{cliente.subdominio || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{cliente.cnpj || '-'}</td>
                  
                  <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(cliente)}
                      className="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      Editar
                    </button>
                    {/* Botão de Contatos */}
                    <Link 
                      href={`/admin/clientes/${cliente.id}/contatos`}
                      className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      Contatos
                    </Link>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MODAL DE EDIÇÃO */}
      {isModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleUpdateSubmit}>
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Editar Cliente: {selectedClient.nome_empresa}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editNomeEmpresa" className="block text-sm font-medium text-gray-700">
                      * Nome da Empresa
                    </label>
                    <input
                      type="text" id="editNomeEmpresa" value={editNomeEmpresa}
                      onChange={(e) => setEditNomeEmpresa(e.target.value)} required
                      className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editSubdominio" className="block text-sm font-medium text-gray-700">
                      * Subdomínio (ex: admina)
                    </label>
                    <input
                      type="text" id="editSubdominio" value={editSubdominio}
                      onChange={(e) => setEditSubdominio(e.target.value)} required
                      className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  Os tokens da Superlógica não podem ser editados. Para alterá-los, remova e cadastre o cliente novamente.
                </div>

                <hr className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="editLogoUrl" className="block text-sm font-medium text-gray-700">
                        URL do Logo (Público)
                        </label>
                        <input
                        type="text" id="editLogoUrl" value={editLogoUrl}
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://.../logo.png"
                        />
                    </div>
                    <div>
                        <label htmlFor="editCnpj" className="block text-sm font-medium text-gray-700">
                        CNPJ
                        </label>
                        <input
                        type="text" id="editCnpj" value={editCnpj}
                        onChange={(e) => setEditCnpj(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* --- NOVA SEÇÃO DE EDIÇÃO: Suporte --- */}
                <fieldset className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                    <legend className="text-sm font-medium text-blue-800 px-2 bg-blue-50 rounded">Contato de Suporte (Aparece no Login)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="editEmailContato" className="block text-sm font-medium text-gray-700">E-mail de Suporte</label>
                        <input
                        type="email" id="editEmailContato" value={editEmailContato}
                        onChange={(e) => setEditEmailContato(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="suporte@empresa.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="editTelefoneContato" className="block text-sm font-medium text-gray-700">Telefone de Suporte</label>
                        <input
                        type="text" id="editTelefoneContato" value={editTelefoneContato}
                        onChange={(e) => setEditTelefoneContato(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(00) 0000-0000"
                        />
                    </div>
                    </div>
                </fieldset>

                <fieldset className="p-4 border rounded-md">
                  <legend className="text-sm font-medium text-gray-700 px-2">Contato de Cobrança (Opcional)</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label htmlFor="editContatoNome" className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text" id="editContatoNome" value={editContatoNome}
                        onChange={(e) => setEditContatoNome(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="editContatoEmail" className="block text-sm font-medium text-gray-700">E-mail</label>
                      <input
                        type="email" id="editContatoEmail" value={editContatoEmail}
                        onChange={(e) => setEditContatoEmail(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="editContatoTelefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        type="text" id="editContatoTelefone" value={editContatoTelefone}
                        onChange={(e) => setEditContatoTelefone(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </fieldset>

              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}