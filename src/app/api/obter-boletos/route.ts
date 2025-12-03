// src/app/api/obter-boletos/route.ts
// ARQUIVO FINAL DA FASE 3 (V2.0)
// REATORADO PARA USAR A TABELA 'contatos_juridicos' DO SUPABASE
// E APOSENTAR O 'legalContacts.json'

import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/utils/supabase/service'; // <--- IMPORTANTE
import { decryptToken } from '@/lib/cryptoUtils';

// --- REMOVIDO ---
// import legalContactsData from '@/data/legalContacts.json';

// --- Interfaces (Mantidas) ---
interface LegalContact { 
  name?: string; 
  phone?: string; 
  email?: string; 
}
// --- REMOVIDO ---
// const legalContacts: { [key: string]: LegalContact } = legalContactsData;

interface UnitInfo { 
  idCondominio: string; 
  nomeCondominio: string; 
  idUnidade: string; 
  nomeUnidade: string; 
}
interface BoletoInfo { 
  id: string; 
  vencimento: string; 
  valor: string; 
  linkPDF?: string; 
  idCondominio: string; 
}
interface GroupedResult {
    condominio: string; 
    unidade: string; 
    boletosVisiveis: BoletoInfo[]; 
    possuiDividaAntiga: boolean; 
    contatoJuridico?: LegalContact; 
}
interface JwtPayload {
    unidades: UnitInfo[];
    subdomain: string; 
}

// --- Funções Auxiliares (Mantidas) ---

// (fetchSuperlogicaAPI)
async function fetchSuperlogicaAPI(url: string, appToken: string, apiToken: string): Promise<any[] | null> {
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
    if (Array.isArray(data)) return data; 
    else if (typeof data === 'object' && data !== null) return [data];
    else return []; 
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON da resposta de ${url} (Texto: ${responseText}):`, jsonError);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// (calculateDaysDifference)
function calculateDaysDifference(dateStr: string): number {
    try {
        const [day, month, year] = dateStr.split('/').map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
            console.warn(`Data de vencimento inválida recebida: ${dateStr}`); return NaN; 
        }
        const dueDate = new Date(Date.UTC(year, month - 1, day)); 
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); 
        const differenceInTime = dueDate.getTime() - today.getTime();
        return Math.round(differenceInTime / (1000 * 3600 * 24)); 
    } catch (e) {
        console.error(`Erro ao calcular diferença de dias para ${dateStr}:`, e); return NaN; 
    }
}


// --- Rota POST Principal (Refatorada) ---
export async function POST(request: NextRequest) {
  try {
    // 1. Obter token
    const { token } = await request.json();
    if (!token) {
        return NextResponse.json({ error: 'Token de acesso não fornecido.' }, { status: 401 });
    }

    // 2. Verificar o Token JWT e extrair o payload
    let decoded: JwtPayload;
    try { 
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; 
    } 
    catch (err: any) { 
        console.error("Erro ao verificar token:", err.message);
        return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 }); 
    }
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    // 3. Buscar e descriptografar tokens da Admin
    const { data: adminData, error: dbError } = await supabaseServiceRole
      .from('administradoras')
      .select('id, token_superlogica_app, token_superlogica_api') // <- Pega o ID da Admin
      .eq('subdominio', subdomain)
      .single();
      
    if (dbError || !adminData?.token_superlogica_app || !adminData?.token_superlogica_api) {
        console.error(`Erro ao buscar tokens para ${subdomain} em /obter-boletos:`, dbError?.message);
        throw new Error('Erro interno [Admin Auth failed].');
    }
    const appToken = decryptToken(adminData.token_superlogica_app);
    const apiToken = decryptToken(adminData.token_superlogica_api);
    const administradoraId = adminData.id; // <-- ID da administradora atual
    
    // 4. --- REATORAÇÃO (INÍCIO) ---
    // Busca TODOS os contatos jurídicos DESTA administradora *uma única vez*
    const { data: contatosData, error: contatosError } = await supabaseServiceRole
      .from('contatos_juridicos')
      .select('id_condominio, name, email, phone')
      .eq('administradora_id', administradoraId) // <-- O "LINK" MÁGICO

    if (contatosError) {
      // Loga o erro mas não quebra a aplicação
      console.error("Erro ao buscar contatos jurídicos do Supabase:", contatosError.message);
    }

    // Cria um Map (dicionário) para consulta rápida: '46' -> { name: '...', ... }
    const contatosMap = new Map<string, LegalContact>();
    if (contatosData) {
      for (const contato of contatosData) {
        if (contato.id_condominio) {
          contatosMap.set(contato.id_condominio, {
            name: contato.name || undefined,
            email: contato.email || undefined,
            phone: contato.phone || undefined
          });
        }
      }
    }
    // --- REATORAÇÃO (FIM) ---

    // 5. Buscar boletos para cada unidade
    const resultadosAgrupados: GroupedResult[] = [];

    for (const unidade of unidades) {
      const { idCondominio, nomeCondominio, idUnidade, nomeUnidade } = unidade;
      let boletosVisiveis: BoletoInfo[] = [];
      let possuiDividaAntiga = false;

      try {
        const dtInicio = '01/01/2020'; 
        const dtFim = '12/31/2026';   
        const urlLista = `https://api.superlogica.net/v2/condor/cobranca/index?status=validos&idCondominio=${idCondominio}&UNIDADES[0]=${idUnidade}&dtInicio=${dtInicio}&dtFim=${dtFim}`;
        
        const boletosDaLista = await fetchSuperlogicaAPI(urlLista, appToken, apiToken); 

        if (Array.isArray(boletosDaLista) && boletosDaLista.length > 0) {
          boletosDaLista.forEach((boletoBase: any) => {
            const idBoletoLog = boletoBase.id_recebimento_recb ?? 'ID Desconhecido';
            const statusLog = boletoBase.fl_status_recb ?? 'Status Desconhecido';
            const situacaoLog = boletoBase.situacao ?? 'Situacao Desconhecida';
            const vencimentoOriginalLog = boletoBase.dt_vencimento_recb ?? 'Vencimento Desconhecido';

            if (statusLog !== '3' && situacaoLog !== 'Liquidado') {
              let vencimentoStr = 'Data Inválida';
              let daysDiff: number = NaN;
              try {
                  vencimentoStr = new Date(vencimentoOriginalLog).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                  daysDiff = calculateDaysDifference(vencimentoStr);
              } catch (dateError){ /* ignora data inválida */ }
              
              if (!isNaN(daysDiff)) {
                  if ((daysDiff >= 0 && daysDiff <= 30) || (daysDiff < 0 && daysDiff >= -60)) {
                    boletosVisiveis.push({
                      id: idBoletoLog, 
                      vencimento: vencimentoStr,
                      valor: `R$ ${parseFloat(boletoBase.vl_total_recb || 0).toFixed(2).replace('.', ',')}`,
                      linkPDF: boletoBase.link_segundavia,
                      idCondominio: idCondominio,
                    });
                  } 
                  else if (daysDiff < -60) {
                    possuiDividaAntiga = true;
                  }
              }
            } 
          }); 
        }
        
        // 6. --- REATORAÇÃO (MUDANÇA FINAL) ---
        // Pega o contato do Map que criamos, em vez do .json
        resultadosAgrupados.push({ 
            condominio: nomeCondominio, unidade: nomeUnidade,
            boletosVisiveis: boletosVisiveis, possuiDividaAntiga: possuiDividaAntiga,
            contatoJuridico: contatosMap.get(idCondominio) || undefined 
        });

      } catch (errorUnidade: any) { 
         console.error(`Erro INESPERADO ao processar boletos para Unidade ${idUnidade}:`, errorUnidade);
      }
    } // Fim do loop de unidades

    console.log(`Dados Agrupados (com filtro) enviados para o frontend (${resultadosAgrupados.length} grupos).`);
    return NextResponse.json({ groupedResults: resultadosAgrupados }); 

  } catch (error: any) { 
    console.error("Erro GERAL na API obter-boletos:", error);
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao obter boletos.' }, { status: status });
  }
}