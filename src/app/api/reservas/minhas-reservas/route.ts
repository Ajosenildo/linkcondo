// src/app/api/reservas/minhas-reservas/route.ts
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

interface Reserva {
  id_reserva_res: string;
  dt_reserva_res: string;
  fl_status_res: string;
  nm_fila_res: string;
  id_unidade_uni: string; 
  st_nome_are: string; 
  id_area_are: string; 
  regraCancelamentoDias: number; 
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
    if (response.status === 404) return [];
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }
  try {
    if (responseText.trim() === '') return [];
    const data = JSON.parse(responseText); 
    return data;
  } catch (jsonError: any) {
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

function parseDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [mes, dia, ano] = datePart.split('/').map(Number); 
    return new Date(Date.UTC(ano, mes - 1, dia)); 
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
    } catch (err: any) { 
        // --- MENSAGEM ATUALIZADA ---
        return NextResponse.json({ error: 'Token inválido ou expirado, renove seu acesso solicitando um novo link.' }, { status: 401 }); 
    }
    
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    const unidadesNesteCondominio = unidades.filter(u => u.idCondominio === idCondominio);
    if (unidadesNesteCondominio.length === 0) {
        return NextResponse.json({ error: 'Acesso não autorizado a este condomínio.' }, { status: 403 });
    }
    const idsUnidadesDoUsuario = unidadesNesteCondominio.map(u => String(u.idUnidade)); 

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

    const url = `https://api.superlogica.net/v2/condor/reservas/areasreservas?idCondominio=${idCondominio}&status=0,1`;
    const respostaCompleta = await fetchSuperlogicaAPI(url, appToken, apiToken);

    let areasList: any[] = []; 
    if (typeof respostaCompleta === 'object' && respostaCompleta !== null && !Array.isArray(respostaCompleta)) {
        Object.values(respostaCompleta).forEach((group: any) => {
            if (group && Array.isArray(group.areas_semelhantes)) {
                areasList.push(...group.areas_semelhantes);
            }
        });
    } else if (Array.isArray(respostaCompleta)) {
        areasList = respostaCompleta;
    }

    const minhasReservas: Reserva[] = [];
    areasList.forEach((area: any) => { 
      if (area.reservas && Array.isArray(area.reservas)) {
        area.reservas.forEach((reserva: any) => { 
          const idUnidadeDaReserva = String(reserva.id_unidade_uni); 
          if (idsUnidadesDoUsuario.includes(idUnidadeDaReserva)) {
            minhasReservas.push({
              id_reserva_res: reserva.id_reserva_res,
              dt_reserva_res: reserva.dt_reserva_res, 
              fl_status_res: reserva.fl_status_res,
              nm_fila_res: reserva.nm_fila_res || '',
              id_unidade_uni: idUnidadeDaReserva,
              st_nome_are: area.st_nome_are || 'Área desconhecida',
              id_area_are: area.id_area_are, 
              regraCancelamentoDias: parseInt(area.nm_antecedenciaminimacancelamento_are || '0', 10) 
            });
          }
        });
      }
    });
    
    minhasReservas.sort((a, b) => {
        const dateA = parseDate(a.dt_reserva_res);
        const dateB = parseDate(b.dt_reserva_res);
        return dateB.getTime() - dateA.getTime(); 
    });
    
    return NextResponse.json(minhasReservas); 
  } catch (error: any) { 
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao buscar reservas.' }, { status: status });
  }
}