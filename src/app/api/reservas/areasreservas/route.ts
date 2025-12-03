import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseServiceRole } from '@/utils/supabase/service'
import { decryptToken } from '@/lib/cryptoUtils'

// Interface para o Token (precisamos do 'subdomain' e 'unidades')
interface JwtPayload {
    unidades: { idCondominio: string }[];
    subdomain: string;
    acao: string;
}

// --- Função Auxiliar: Fetch Superlógica (Genérica) ---
// (Copiada de 'obter-boletos', pois faz o mesmo trabalho)
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
    if (response.status === 404) return []; // Retorna vazio se não achar
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }
  try {
    if (responseText.trim() === '') return [];
    const data = JSON.parse(responseText); 
    return data; // Retorna a resposta (seja array ou objeto)
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON da resposta de ${url} (Texto: ${responseText}):`, jsonError);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// --- Rota POST (para buscar as reservas de uma área) ---
// Usamos POST para que o frontend possa nos enviar o token e o idArea
export async function POST(request: NextRequest) {
  try {
    // 1. Obter o token E o idArea que o frontend enviou
    const { token, idArea } = await request.json();
    if (!token || !idArea) {
        return NextResponse.json({ error: 'Token de acesso e ID da Área são obrigatórios.' }, { status: 401 });
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
    
    // 3. Extrair os dados necessários do token
    const { unidades, subdomain } = decoded; 
    if (!unidades || !Array.isArray(unidades) || unidades.length === 0 || !subdomain) {
      throw new Error('Token não contém informações de unidades ou subdomínio válidas.'); 
    }
    
    const idCondominio = unidades[0].idCondominio;

    // 4. Buscar e descriptografar tokens da Admin (igual à API de boletos)
    const { data: adminData, error: dbError } = await supabaseServiceRole
      .from('administradoras')
      .select('token_superlogica_app, token_superlogica_api')
      .eq('subdominio', subdomain)
      .single();
      
    if (dbError || !adminData?.token_superlogica_app || !adminData?.token_superlogica_api) {
        console.error(`Erro ao buscar tokens para ${subdomain} em /api/reservas/areasreservas:`, dbError?.message);
        throw new Error('Erro interno [Admin Auth failed].');
    }
    const appToken = decryptToken(adminData.token_superlogica_app);
    const apiToken = decryptToken(adminData.token_superlogica_api);
    console.log(`Buscando reservas para Condomínio ID: ${idCondominio}, Área ID: ${idArea}...`);

    // 5. Chamar a API da Superlógica que VOCÊ ENCONTROU
    // (Vamos buscar status 0=Pendentes e 1=Confirmadas)
    const url = `https://api.superlogica.net/v2/condor/reservas/areasreservas?idCondominio=${idCondominio}&idArea=${idArea}&status=0,1`;
    
    const reservasData = await fetchSuperlogicaAPI(url, appToken, apiToken);

    // 6. Retornar os dados
    return NextResponse.json(reservasData); 

  } catch (error: any) { 
    console.error("Erro GERAL na API /api/reservas/areasreservas:", error);
    const status = error.message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao buscar reservas.' }, { status: status });
  }
}