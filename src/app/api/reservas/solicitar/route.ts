// ARQUIVO FINAL CORRIGIDO (V11): src/app/api/reservas/solicitar/route.ts
// ATUALIZADO (Fase 19):
// - Remove a checagem interna de campo (item.id_recebimento_recb) que estava causando falso-negativo.
// - A lógica agora é: Se a API de Inadimplência retorna um array com QUALQUER conteúdo, bloqueia.

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseServiceRole } from '@/utils/supabase/service'
import { decryptToken } from '@/lib/cryptoUtils'

interface JwtPayload {
    unidades: { idCondominio: string, idUnidade: string }[];
    subdomain: string;
    acao: string;
}

// --- Função Auxiliar GET ---
async function fetchSuperlogicaAPI_GET(url: string, appToken: string, apiToken: string): Promise<any> {
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
    if (response.status === 404) return []; 
    console.error(`Erro ${response.status} da API Superlógica em ${url}. Resposta: ${responseText}`);
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }
  try {
    if (responseText.trim() === '') return [];
    const data = JSON.parse(responseText); 
    return data; 
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON: ${jsonError}`);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// --- Função Auxiliar POST ---
async function fetchSuperlogicaAPI_POST_Form(
  url: string, 
  appToken: string, 
  apiToken: string, 
  bodyData: Record<string, string>
): Promise<any> {
  
  const formBody = new URLSearchParams(bodyData).toString();
  let response;
  try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'app_token': appToken, 
          'access_token': apiToken,
        },
        body: formBody,
      });
  } catch (networkError: any) {
      throw new Error(`Erro de rede ao conectar com a Superlógica: ${networkError.message}`);
  }
  
  let responseText = '';
  try { responseText = await response.text(); } 
  catch (readError: any) { throw new Error(`Erro ao ler resposta da Superlógica.`); }

  if (!response.ok) {
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
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// --- Helper para Data de Hoje (MM/DD/YYYY) ---
function getTodayDateString(): string {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`; 
}

// --- Rota POST Principal ---
export async function POST(request: NextRequest) {
  try {
    const { token, idArea, dataReserva, idCondominio, idUnidade, regraBloquearInadimplente } = await request.json();
    if (!token || !idArea || !dataReserva || !idCondominio || !idUnidade || !regraBloquearInadimplente) {
        return NextResponse.json({ error: 'Token, IDs e Regras são obrigatórios.' }, { status: 400 });
    }

    let decoded: JwtPayload;
    try { 
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; 
    } 
    catch (err: any) { 
        return NextResponse.json({ error: 'Token inválido ou expirado, renove seu acesso solicitando um novo link.' }, { status: 401 }); 
    }
    
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    const unidadeInfo = unidades.find(u => u.idCondominio === idCondominio && u.idUnidade === idUnidade);
    if (!unidadeInfo) {
        return NextResponse.json({ error: 'Acesso não autorizado a esta unidade/condomínio.' }, { status: 403 });
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
    
    // --- VERIFICAÇÃO DE INADIMPLÊNCIA (V11 - DEFINITIVA) ---
    if (regraBloquearInadimplente === '1') {
        console.log(`[DEBUG] Verificando inadimplência (V11) para Unidade ${idUnidade}...`);
        
        const hoje = getTodayDateString(); 
        
        const urlInadimplencia = `https://api.superlogica.net/v2/condor/inadimplencia/index?idCondominio=${idCondominio}&id=${idUnidade}&posicaoEm=${hoje}&itensPorPagina=50`;
        
        const dadosInadimplencia = await fetchSuperlogicaAPI_GET(urlInadimplencia, appToken, apiToken);
        
        // V11: Se o retorno for um Array E tiver mais de 0 itens, BLOQUEAMOS.
        if (Array.isArray(dadosInadimplencia) && dadosInadimplencia.length > 0) {
            
            // Não precisamos de checagem de campos. A própria existência do Array já é a prova.
            console.log(`[BLOQUEIO] Inadimplência confirmada. Array com ${dadosInadimplencia.length} registros.`);
            
            return NextResponse.json({ 
                error: 'Reserva não permitida conforme as regras definidas. Verifique se consta pendência na sua unidade ou procure a administração do condomínio.' 
            }, { status: 403 });
        } else {
            console.log(`[LIBERADO] Lista de inadimplência vazia.`);
        }
    }
    // --- FIM DA VERIFICAÇÃO ---

    const dataObj = new Date(dataReserva);
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getUTCDate()).padStart(2, '0');
    const ano = dataObj.getUTCFullYear();
    const dataFormatada = `${mes}/${dia}/${ano}`;

    const url = `https://api.superlogica.net/v2/condor/reservas/`;
    const bodyParams = {
      'ID_CONDOMINIO_COND': idCondominio,
      'ID_UNIDADE_UNI': idUnidade,
      'ID_AREA_ARE': idArea,
      'DT_RESERVA_RES': dataFormatada,
      'FL_RESERVA_JA_CONFIRMADA': '0'
    };
    
    const reservaData = await fetchSuperlogicaAPI_POST_Form(url, appToken, apiToken, bodyParams);

    return NextResponse.json({ 
      message: 'Solicitação de reserva enviada com sucesso! Aguarde a confirmação.',
      data: reservaData 
    }); 

  } catch (error: any) { 
    console.error("Erro GERAL na API /api/reservas/solicitar:", error);
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao solicitar reserva.' }, { status: status });
  }
}