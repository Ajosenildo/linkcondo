// src/app/api/public/tenant/[subdomain]/route.ts
// ATUALIZADO PARA NEXT.JS 15 (Params agora são Promises)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/utils/supabase/service'

// A tipagem mudou no Next 15: params é uma Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> } // <-- 1. Mudança na Tipagem
) {
  try {
    // 2. Mudança na Lógica: Precisamos fazer o await do params
    const { subdomain } = await params

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomínio não fornecido' }, { status: 400 })
    }

    // 1. Buscar no Supabase usando a Service Role
    const { data, error } = await supabaseServiceRole
      .from('administradoras')
      .select('nome_empresa, logo_url, email_contato, telefone_contato') 
      .eq('subdominio', subdomain)
      .single() 

    // 2. Se não encontrar
    if (error || !data) {
      if (error) console.error('Erro ao buscar tenant:', error.message)
      return NextResponse.json({ error: 'Administradora não encontrada' }, { status: 404 })
    }

    // 3. Sucesso!
    return NextResponse.json({
      nome_empresa: data.nome_empresa,
      logo_url: data.logo_url,
      email_contato: data.email_contato,
      telefone_contato: data.telefone_contato,
    })

  } catch (err: any) {
    console.error('Erro inesperado na API /public/tenant:', err.message)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}