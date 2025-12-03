'use client'

import { useState } from 'react'
// A interface 'ContatoJuridico' agora é importada do 'page.tsx'
// mas vamos redefini-la aqui para incluir o novo campo
export interface ContatoJuridico {
  id: number
  created_at: string
  id_condominio: string | null
  nome_condominio_referencia: string | null // <-- NOVO CAMPO
  name: string | null
  email: string | null
  phone: string | null
  administradora_id: number | null
}

// Define as props do componente, que recebe a lista inicial do servidor
interface ContactManagerProps {
  administradoraId: number
  administradoraNome: string
  initialContatos: ContatoJuridico[]
}

export function ContactManager({ administradoraId, administradoraNome, initialContatos }: ContactManagerProps) {
  // --- ESTADOS GERAIS ---
  const [contatos, setContatos] = useState(initialContatos)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // --- ESTADOS DO FORMULÁRIO DE CRIAR ---
  const [newIdCondominio, setNewIdCondominio] = useState('')
  const [newNomeReferencia, setNewNomeReferencia] = useState('') // <-- NOVO
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  // --- ESTADOS DO MODAL DE EDITAR ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContatoJuridico | null>(null)
  const [editIdCondominio, setEditIdCondominio] = useState('')
  const [editNomeReferencia, setEditNomeReferencia] = useState('') // <-- NOVO
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  
  // --- ESTADOS DO MODAL DE DELETAR ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<ContatoJuridico | null>(null)
  
  // --- ESTADOS DO MODAL DE IMPORTAÇÃO ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [fileToImport, setFileToImport] = useState<File | null>(null)

  // --- FUNÇÕES ---

  // Limpa o formulário de *criar*
  const resetCreateForm = () => {
    setNewIdCondominio('')
    setNewNomeReferencia('') // <-- NOVO
    setNewName('')
    setNewEmail('')
    setNewPhone('')
  }

  // 1. FUNÇÃO DE CRIAR (handleSubmit)
  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_condominio: newIdCondominio,
          nome_condominio_referencia: newNomeReferencia, // <-- NOVO
          name: newName,
          email: newEmail,
          phone: newPhone,
          administradora_id: administradoraId 
        }),
      })

      const novoContato = await response.json()
      if (!response.ok) throw new Error(novoContato.error || 'Falha ao criar contato')

      setContatos([novoContato, ...contatos]) 
      setMessage('Contato criado com sucesso!')
      resetCreateForm()

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 2. FUNÇÃO DE ABRIR MODAL (handleEditClick)
  const handleEditClick = (contato: ContatoJuridico) => {
    setSelectedContact(contato)
    setEditIdCondominio(contato.id_condominio || '')
    setEditNomeReferencia(contato.nome_condominio_referencia || '') // <-- NOVO
    setEditName(contato.name || '')
    setEditEmail(contato.email || '')
    setEditPhone(contato.phone || '')
    setIsEditModalOpen(true)
  }

  // 3. FUNÇÃO DE EDITAR (handleUpdateSubmit)
  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedContact) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/contatos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContact.id,
          id_condominio: editIdCondominio,
          nome_condominio_referencia: editNomeReferencia, // <-- NOVO
          name: editName,
          email: editEmail,
          phone: editPhone,
          administradora_id: administradoraId 
        }),
      })

      const contatoAtualizado = await response.json()
      if (!response.ok) throw new Error(contatoAtualizado.error || 'Falha ao atualizar contato')

      setContatos(
        contatos.map((c) =>
          c.id === contatoAtualizado.id ? contatoAtualizado : c
        )
      )
      setMessage('Contato atualizado com sucesso!')
      setIsEditModalOpen(false)

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 4. FUNÇÃO DE ABRIR CONFIRMAÇÃO DE DELEÇÃO
  const handleDeleteClick = (contato: ContatoJuridico) => {
    setContactToDelete(contato)
    setIsDeleteModalOpen(true)
  }

  // 5. FUNÇÃO DE DELETAR (handleConfirmDelete)
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/contatos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contactToDelete.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao deletar contato')
      
      setContatos(contatos.filter((c) => c.id !== contactToDelete.id))
      setMessage('Contato deletado com sucesso!')
      setIsDeleteModalOpen(false)

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // 6. FUNÇÃO DE IMPORTAÇÃO DE PLANILHA (CSV)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToImport(e.target.files[0])
    }
  }

  const handleImportSubmit = async () => {
    if (!fileToImport) {
      setMessage('Por favor, selecione um arquivo CSV.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', fileToImport)
      formData.append('administradora_id', String(administradoraId))
      
      const response = await fetch('/api/admin/contatos/import', {
        method: 'POST',
        body: formData, 
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao importar planilha')

      setMessage(data.message)
      // Recarrega a página para ver os novos dados
      window.location.reload() 

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  // --- RENDERIZAÇÃO (JSX) ---
  return (
    <div className="space-y-8">
      
      {/* 1. Cabeçalho da Página */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Contatos Jurídicos de: 
          <span className="text-blue-600 ml-2">{administradoraNome}</span>
        </h2>
        
        {/* BOTÃO DE IMPORTAR */}
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Importar Planilha (CSV)
        </button>
      </div>

      {/* 2. Formulário de ADICIONAR NOVO CONTATO */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Adicionar Novo Contato
        </h3>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newIdCondominio" className="block text-sm font-medium text-gray-700">
                * ID Condomínio (Ex: 44, 46)
              </label>
              <input
                type="text" id="newIdCondominio" value={newIdCondominio}
                onChange={(e) => setNewIdCondominio(e.target.value)} required
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* --- NOVO CAMPO DE REFERÊNCIA --- */}
            <div>
              <label htmlFor="newNomeReferencia" className="block text-sm font-medium text-gray-700">
                Nome do Condomínio (Referência)
              </label>
              <input
                type="text" id="newNomeReferencia" value={newNomeReferencia}
                onChange={(e) => setNewNomeReferencia(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Cond. Green Life"
              />
            </div>
            {/* --- FIM DO NOVO CAMPO --- */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="newName" className="block text-sm font-medium text-gray-700">
                Nome do Contato/Depto
              </label>
              <input
                type="text" id="newName" value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email" id="newEmail" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="text" id="newPhone" value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Salvar Novo Contato'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${message.startsWith('Erro:') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>

      {/* 3. Tabela de CONTATOS CADASTRADOS */}
      <div className="p-6 bg-white rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Contatos Cadastrados
        </h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Cond.</th>
              {/* --- NOVA COLUNA DE REFERÊNCIA --- */}
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do Condomínio (Ref.)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Contato</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contatos.length > 0 ? (
              contatos.map((contato) => (
                <tr key={contato.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700 bg-gray-50">{contato.id_condominio || '-'}</td>
                  {/* --- NOVA COLUNA DE REFERÊNCIA --- */}
                  <td className="px-4 py-3 text-sm text-gray-900">{contato.nome_condominio_referencia || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{contato.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{contato.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{contato.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => handleEditClick(contato)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(contato)}
                      className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum contato jurídico cadastrado para esta administradora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL DE EDIÇÃO */}
      {isEditModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={handleUpdateSubmit}>
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Editar Contato (ID: {selectedContact.id})
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editIdCondominio" className="block text-sm font-medium text-gray-700">
                      * ID Condomínio
                    </label>
                    <input
                      type="text" id="editIdCondominio" value={editIdCondominio}
                      onChange={(e) => setEditIdCondominio(e.target.value)} required
                      className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {/* --- NOVO CAMPO DE REFERÊNCIA --- */}
                  <div>
                    <label htmlFor="editNomeReferencia" className="block text-sm font-medium text-gray-700">
                      Nome do Condomínio (Ref.)
                    </label>
                    <input
                      type="text" id="editNomeReferencia" value={editNomeReferencia}
                      onChange={(e) => setEditNomeReferencia(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                    Nome Contato
                  </label>
                  <input
                    type="text" id="editName" value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    type="email" id="editEmail" value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="text" id="editPhone" value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* 5. MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
      {isDeleteModalOpen && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800">Confirmar Exclusão</h3>
              <p className="mt-2 text-sm text-gray-600">
                Tem certeza que deseja excluir o contato para o Condomínio ID 
                <strong className="mx-1">{contactToDelete.id_condominio}</strong>
                ({contactToDelete.name || 'Sem nome'})? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 6. MODAL DE IMPORTAÇÃO DE PLANILHA (CSV) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Importar Contatos via Planilha (CSV)
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Selecione um arquivo CSV para importação. O arquivo deve conter 5 colunas, nesta ordem: 
                <br/>
                <code className="text-xs bg-gray-100 p-1 rounded">id_condominio</code>, 
                {/* --- NOVA COLUNA DE REFERÊNCIA --- */}
                <code className="text-xs bg-gray-100 p-1 rounded">nome_condominio_referencia</code>, 
                <code className="text-xs bg-gray-100 p-1 rounded">name</code>, 
                <code className="text-xs bg-gray-100 p-1 rounded">email</code>, 
                <code className="text-xs bg-gray-100 p-1 rounded">phone</code>.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Atenção:</strong> A importação irá <strong className="text-red-600">APAGAR</strong> todos os contatos existentes desta administradora e os substituirá pelos contatos do arquivo.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={loading || !fileToImport}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Importando...' : 'Iniciar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}