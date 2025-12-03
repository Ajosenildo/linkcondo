// src/app/api/admin/clientes/route.ts
// ATUALIZADO para incluir 'logo_url' no POST (Criar) e PUT (Editar)
// Nome da tabela 'administradoras' CORRIGIDO

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { encryptToken } from '@/lib/cryptoUtils'
import { supabaseServiceRole } from '@/utils/supabase/service'

// --- FUNÇÃO POST (Criar Novo Cliente) ---
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  // 2. Obter dados do formulário (AGORA INCLUINDO LOGO)
  const { 
    nome_empresa, 
    subdominio, 
    token_superlogica_app, 
    token_superlogica_api,
    cnpj,
    contato_cobranca_nome,
    contato_cobranca_email,
    contato_cobranca_telefone,
    logo_url // <- NOVO CAMPO
  } = await request.json()

  // 3. Validação básica
  if (!nome_empresa || !subdominio || !token_superlogica_app || !token_superlogica_api) {
    return NextResponse.json({ error: 'Campos obrigatórios (Nome, Subdomínio, Tokens) estão faltando.' }, { status: 400 })
  }

  try {
    // 4. Criptografar os tokens
    const appTokenCriptografado = encryptToken(token_superlogica_app)
    const apiTokenCriptografado = encryptToken(token_superlogica_api)

    // 5. Inserir no Supabase (usando a Service Role para bypass RLS)
    // NOME DA TABELA CORRIGIDO para 'administradoras'
    const { data, error } = await supabaseServiceRole
      .from('administradoras') // <--- NOME CORRETO
      .insert({
        nome_empresa,
        subdominio,
        token_superlogica_app: appTokenCriptografado,
        token_superlogica_api: apiTokenCriptografado,
        cnpj,
        contato_cobranca_nome,
        contato_cobranca_email,
        contato_cobranca_telefone,
        logo_url // <- SALVANDO O NOVO CAMPO
      })
      .select() // Retorna o registro criado
      .single()

    if (error) {
      console.error('Erro ao inserir no Supabase:', error.message)
      return NextResponse.json({ error: `Erro ao salvar no banco: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data) // Retorna o novo cliente para o frontend

  } catch (err: any) {
    console.error('Erro de criptografia ou inesperado:', err.message)
    if (err.message.includes('autenticação do token')) {
       return NextResponse.json({ error: 'Erro de segurança: Falha ao criptografar tokens. Verifique sua ENCRYPTION_KEY.' }, { status: 500 })
    }
    return NextResponse.json({ error: `Erro interno do servidor: ${err.message}` }, { status: 500 })
  }
}


// --- FUNÇÃO PUT (Editar Cliente) ---
export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  // 2. Obter dados do formulário (AGORA INCLUINDO LOGO)
  const { 
    id, // ID é essencial para saber QUEM editar
    nome_empresa, 
    subdominio,
    cnpj,
    contato_cobranca_nome,
    contato_cobranca_email,
    contato_cobranca_telefone,
    logo_url // <- NOVO CAMPO
  } = await request.json()

  // 3. Validação
  if (!id || !nome_empresa || !subdominio) {
    return NextResponse.json({ error: 'ID, Nome da Empresa e Subdomínio são obrigatórios.' }, { status: 400 })
  }

  try {
    // 4. Atualizar no Supabase (usando Service Role)
    // NOME DA TABELA CORRIGIDO para 'administradoras'
    const { data, error } = await supabaseServiceRole
      .from('administradoras') // <--- NOME CORRETO
      .update({
        nome_empresa,
        subdominio,
        cnpj,
        contato_cobranca_nome,
        contato_cobranca_email,
        contato_cobranca_telefone,
        logo_url // <- SALVANDO O NOVO CAMPO
      })
      .eq('id', id) // Aonde a mágica acontece
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error.message)
      return NextResponse.json({ error: `Erro ao atualizar no banco: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data) // Retorna o cliente atualizado

  } catch (err: any) {
    console.error('Erro inesperado no PUT:', err.message)
    return NextResponse.json({ error: `Erro interno do servidor: ${err.message}` }, { status: 500 })
  }
}