// src/app/api/public/tenant/[subdomain]/route.ts
// ATUALIZADO: Inclui email_contato e telefone_contato na busca pública.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/utils/supabase/service'

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const subdomain = params.subdomain

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomínio não fornecido' }, { status: 400 })
    }

    const { data, error } = await supabaseServiceRole
      .from('administradoras')
      // --- AQUI ESTÁ O SEGREDO: Pedindo os campos novos ---
      .select('nome_empresa, logo_url, email_contato, telefone_contato') 
      .eq('subdominio', subdomain)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Administradora não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      nome_empresa: data.nome_empresa,
      logo_url: data.logo_url,
      // Retornando os novos campos
      email_contato: data.email_contato,
      telefone_contato: data.telefone_contato,
    })

  } catch (err: any) {
    console.error('Erro inesperado na API /public/tenant:', err.message)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}