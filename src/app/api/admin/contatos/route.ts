import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { supabaseServiceRole } from '@/utils/supabase/service'

// --- FUNÇÃO POST (Criar Novo Contato) ---
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin (segurança)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  // 2. Obter dados do formulário
  // (incluindo o 'nome_condominio_referencia')
  const { 
    id_condominio, 
    nome_condominio_referencia, // <-- NOVO CAMPO
    name, 
    email, 
    phone, 
    administradora_id 
  } = await request.json()
  
  if (!id_condominio || !administradora_id) {
    return NextResponse.json({ error: 'O ID do Condomínio e o ID da Administradora são obrigatórios.' }, { status: 400 })
  }

  try {
    // 3. Inserir no Supabase (usando a Service Role)
    const { data, error } = await supabaseServiceRole
      .from('contatos_juridicos') 
      .insert({
        id_condominio,
        nome_condominio_referencia, // <-- SALVA O NOVO CAMPO
        name,
        email,
        phone,
        administradora_id 
      })
      .select() // Retorna o registro criado
      .single()

    if (error) throw error
    return NextResponse.json(data) // Retorna o novo contato para o frontend

  } catch (err: any) {
    console.error('Erro ao criar contato:', err.message)
    return NextResponse.json({ error: `Erro ao salvar no banco: ${err.message}` }, { status: 500 })
  }
}


// --- FUNÇÃO PUT (Editar Contato) ---
export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin (segurança)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  // 2. Obter dados do formulário
  // (incluindo o 'nome_condominio_referencia')
  const { 
    id, 
    id_condominio, 
    nome_condominio_referencia, // <-- NOVO CAMPO
    name, 
    email, 
    phone, 
    administradora_id 
  } = await request.json()

  if (!id || !id_condominio || !administradora_id) {
    return NextResponse.json({ error: 'ID, ID do Condomínio e ID da Administradora são obrigatórios.' }, { status: 400 })
  }

  try {
    // 3. Atualizar no Supabase (usando Service Role)
    const { data, error } = await supabaseServiceRole
      .from('contatos_juridicos')
      .update({
        id_condominio,
        nome_condominio_referencia, // <-- ATUALIZA O NOVO CAMPO
        name,
        email,
        phone,
        administradora_id 
      })
      .eq('id', id) // Aonde a mágica acontece
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data) // Retorna o contato atualizado

  } catch (err: any) {
    console.error('Erro ao atualizar contato:', err.message)
    return NextResponse.json({ error: `Erro ao atualizar no banco: ${err.message}` }, { status: 500 })
  }
}


// --- FUNÇÃO DELETE (Excluir Contato) ---
// (Sem alterações aqui, o DELETE só precisa do ID)
export async function DELETE(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin (segurança)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  // 2. Obter ID do corpo da requisição
  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório para exclusão.' }, { status: 400 })
  }

  try {
    // 3. Deletar do Supabase (usando Service Role)
    const { error } = await supabaseServiceRole
      .from('contatos_juridicos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ message: 'Contato excluído com sucesso' })

  } catch (err: any) {
    console.error('Erro ao deletar contato:', err.message)
    return NextResponse.json({ error: `Erro ao deletar no banco: ${err.message}` }, { status: 500 })
  }
}