// src/app/api/reservas/areas/route.ts
// ATUALIZADO: Nova mensagem de token expirado.

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseServiceRole } from '@/utils/supabase/service'
import { decryptToken } from '@/lib/cryptoUtils'

interface JwtPayload {
    unidades: { idCondominio: string, idUnidade: string }[];
    subdomain: string;
    acao: string;
}

async function fetchSuperlogicaAPI(url: string, appToken: string, apiToken: string): Promise<any> {
  let response;
  try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'app_token': appToken, 'access_token': apiToken,
        },
      });
  } catch (networkError: any) {
      console.error(`Erro de REDE ao acessar ${url}:`, networkError);
      throw new Error(`Erro de rede ao conectar com a Superlógica: ${networkError.message}`);
  }
  
  let responseText = '';
  try { responseText = await response.text(); } 
  catch (readError: any) { throw new Error(`Erro ao ler resposta da Superlógica.`); }

  if (!response.ok) {
    console.error(`Erro ${response.status} da API Superlógica em ${url}. Resposta: ${responseText}`);
    if (response.status === 404) return [];
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }
  try {
    if (responseText.trim() === '') return [];
    const data = JSON.parse(responseText); 
    return data;
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON da resposta de ${url} (Texto: ${responseText}):`, jsonError);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, idCondominio } = await request.json();
    if (!token || !idCondominio) {
        return NextResponse.json({ error: 'Token e ID do Condomínio são obrigatórios.' }, { status: 400 });
    }

    let decoded: JwtPayload;
    try { 
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; 
    } 
    catch (err: any) { 
        console.error("Erro ao verificar token:", err.message);
        // --- MENSAGEM ATUALIZADA ---
        return NextResponse.json({ error: 'Token inválido ou expirado, renove seu acesso solicitando um novo link.' }, { status: 401 }); 
    }
    
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    const unidadeInfo = unidades.find(u => u.idCondominio === idCondominio);
    if (!unidadeInfo) {
        return NextResponse.json({ error: 'Acesso não autorizado a este condomínio.' }, { status: 403 });
    }

    const { data: adminData, error: dbError } = await supabaseServiceRole
      .from('administradoras')
      .select('token_superlogica_app, token_superlogica_api')
      .eq('subdominio', subdomain)
      .single();
      
    if (dbError || !adminData?.token_superlogica_app || !adminData?.token_superlogica_api) {
        throw new Error('Erro interno [Admin Auth failed].');
    }
    const appToken = decryptToken(adminData.token_superlogica_app);
    const apiToken = decryptToken(adminData.token_superlogica_api);
    
    const url = `https://api.superlogica.net/v2/condor/reservas/areas?idCondominio=${idCondominio}`;
    const resposta = await fetchSuperlogicaAPI(url, appToken, apiToken);
    
    if (Array.isArray(resposta)) {
        return NextResponse.json(resposta);
    }
    if (resposta && resposta.areas_semelhantes) {
        return NextResponse.json(resposta.areas_semelhantes);
    }

    return NextResponse.json([]);

  } catch (error: any) { 
    console.error("Erro GERAL na API /api/reservas/areas:", error);
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao buscar áreas.' }, { status: status });
  }
}