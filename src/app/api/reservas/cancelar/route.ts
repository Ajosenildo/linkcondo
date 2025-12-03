// src/app/api/reservas/cancelar/route.ts
// CORRIGIDO: Versão única e limpa.

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseServiceRole } from '@/utils/supabase/service'
import { decryptToken } from '@/lib/cryptoUtils'

// Interface para o Token
interface JwtPayload {
    unidades: { idCondominio: string, idUnidade: string }[];
    subdomain: string;
}

// --- Função Auxiliar: Fetch Superlógica (PUT-Form) ---
async function fetchSuperlogicaAPI_PUT_Form(
  url: string, 
  appToken: string, 
  apiToken: string, 
  bodyData: Record<string, string>
): Promise<any> {
  
  const formBody = new URLSearchParams(bodyData).toString();
  let response;
  try {
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'app_token': appToken, 
          'access_token': apiToken,
        },
        body: formBody,
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
    try {
      const errorJson = JSON.parse(responseText);
      if (errorJson.msg) { throw new Error(errorJson.msg); }
    } catch (e) { /* ignora */ }
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }
  try {
    if (responseText.trim() === '') return {};
    const data = JSON.parse(responseText); 
    return data;
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON da resposta de ${url} (Texto: ${responseText}):`, jsonError);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// --- Rota POST (para SOLICITAR o cancelamento) ---
export async function POST(request: NextRequest) {
  try {
    // 1. Obter os dados do frontend
    const { token, idCondominio, idReserva, idArea, motivo } = await request.json();
    if (!token || !idCondominio || !idReserva || !idArea || !motivo) {
        return NextResponse.json({ error: 'Token, IDs e Motivo são obrigatórios.' }, { status: 400 });
    }

    // 2. Verificar o Token JWT e extrair o payload
    let decoded: JwtPayload;
    try { 
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; 
    } 
    catch (err: any) { 
        // Mensagem atualizada conforme solicitado
        return NextResponse.json({ error: 'Token inválido ou expirado, renove seu acesso solicitando um novo link.' }, { status: 401 }); 
    }
    
    // 3. Extrair os dados necessários do token
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    // 4. VERIFICAÇÃO DE SEGURANÇA
    // Garante que o idCondominio enviado pertence ao usuário do token
    const unidadeInfo = unidades.find(u => u.idCondominio === idCondominio);
    if (!unidadeInfo) {
        return NextResponse.json({ error: 'Acesso não autorizado a este condomínio.' }, { status: 403 });
    }

    // 5. Buscar e descriptografar tokens da Admin
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
    
    console.log(`Cancelando reserva ${idReserva} (Área: ${idArea}, Condo: ${idCondominio})...`);

    // 6. Chamar a API da Superlógica
    const url = `https://api.superlogica.net/v2/condor/reservas/cancelar`;
    
    const bodyParams = {
      'ID_AREA_ARE': idArea,
      'ID_RESERVA_RES': idReserva,
      'ID_CONDOMINIO_COND': idCondominio,
      'ST_MOTIVOCANCELAMENTO_RES': motivo, // Motivo é obrigatório
      'FL_NAO_NOTIFICAR_CONDOMINO': '0' // Sempre notificar
    };
    
    const cancelData = await fetchSuperlogicaAPI_PUT_Form(url, appToken, apiToken, bodyParams);

    // 7. Retornar os dados
    return NextResponse.json({ 
      message: 'Reserva cancelada com sucesso!',
      data: cancelData 
    }); 

  } catch (error: any) { 
    console.error("Erro GERAL na API /api/reservas/cancelar:", error);
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao cancelar reserva.' }, { status: status });
  }
}