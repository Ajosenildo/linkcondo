'use client'

import { useState } from 'react'
import { ContatoJuridico } from './page' // Importa a interface que definimos no Arquivo 3

// Define as props do componente, que recebe a lista inicial do servidor
interface ContactManagerProps {
  initialContatos: ContatoJuridico[]
}

export default function ContactManager({ initialContatos }: ContactManagerProps) {
  // --- ESTADOS GERAIS ---
  const [contatos, setContatos] = useState(initialContatos)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // --- ESTADOS DO FORMULÁRIO DE CRIAR ---
  const [newIdCondominio, setNewIdCondominio] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  // --- ESTADOS DO MODAL DE EDITAR ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContatoJuridico | null>(null)
  const [editIdCondominio, setEditIdCondominio] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  
  // --- ESTADOS DO MODAL DE DELETAR ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<ContatoJuridico | null>(null)

  // --- FUNÇÕES ---

  // Limpa o formulário de *criar*
  const resetCreateForm = () => {
    setNewIdCondominio('')
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
      // (Esta API será o Arquivo 5)
      const response = await fetch('/api/admin/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_condominio: newIdCondominio,
          name: newName,
          email: newEmail,
          phone: newPhone,
        }),
      })

      const novoContato = await response.json()
      if (!response.ok) throw new Error(novoContato.error || 'Falha ao criar contato')

      // Sucesso!
      setContatos([novoContato, ...contatos]) // Adiciona o novo no topo
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
      // (Esta API será o Arquivo 5)
      const response = await fetch('/api/admin/contatos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContact.id,
          id_condominio: editIdCondominio,
          name: editName,
          email: editEmail,
          phone: editPhone,
        }),
      })

      const contatoAtualizado = await response.json()
      if (!response.ok) throw new Error(contatoAtualizado.error || 'Falha ao atualizar contato')

      // Sucesso!
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
      // (Esta API será o Arquivo 5)
      const response = await fetch('/api/admin/contatos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contactToDelete.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao deletar contato')
      
      // Sucesso!
      setContatos(contatos.filter((c) => c.id !== contactToDelete.id))
      setMessage('Contato deletado com sucesso!')
      setIsDeleteModalOpen(false)

    } catch (err: any) {
      setMessage(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  // --- RENDERIZAÇÃO (JSX) ---
  return (
    <div className="space-y-8">
      
      {/* 1. Formulário de ADICIONAR NOVO CONTATO */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Adicionar Novo Contato Jurídico
        </h2>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* 2. Tabela de CONTATOS CADASTRADOS */}
      <div className="p-6 bg-white rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Contatos Cadastrados
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Condomínio</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
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
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum contato jurídico cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MODAL DE EDIÇÃO */}
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
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                    Nome
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

      {/* 4. MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
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
    </div>
  )
}