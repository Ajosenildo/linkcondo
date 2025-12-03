// src/app/api/obter-link-pdf/route.ts
// ARQUIVO TOTALMENTE REESCRITO PARA SER MULTI-TENANT
// Esta rota agora exige o 'token' para saber de qual 'subdomain' buscar os tokens no Supabase.

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseServiceRole } from '@/utils/supabase/service';
import { decryptToken } from '@/lib/cryptoUtils';

// Interface para o payload do token
interface JwtPayload {
    unidades: any[]; // Não precisamos das unidades aqui, mas o token as tem
    subdomain: string; 
}

export async function POST(request: NextRequest) {
  try {
    // 1. Obter TODOS os dados necessários
    // O 'token' agora é obrigatório
    const { idCondominio, idBoleto, vencimento, token } = await request.json(); 
    
    if (!token) {
        console.error("Requisição para obter-link-pdf sem token.");
        return NextResponse.json({ error: 'Token de autenticação é obrigatório.' }, { status: 401 });
    }
    if (!idCondominio || !idBoleto || !vencimento) {
        console.error("Requisição para obter-link-pdf sem os dados do boleto.");
        return NextResponse.json({ error: 'IDs e vencimento são obrigatórios.' }, { status: 400 });
    }
    
    // 2. Verificar o Token JWT
    let decoded: JwtPayload;
    try { 
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload; 
    } catch (err: any) { 
        console.error("Erro ao verificar token em /obter-link-pdf:", err.message);
        return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 }); 
    }
    
    // 3. Extrair o Subdomain
    const { subdomain } = decoded;
    if (!subdomain) {
        console.error("Token não contém subdomínio.");
        return NextResponse.json({ error: 'Token não contém informações de administradora.' }, { status: 401 });
    }
    
    console.log(`Buscando link PDF para Boleto ${idBoleto} (Tenant: ${subdomain})`);

    // 4. Buscar e descriptografar tokens da Admin (LÓGICA MULTI-TENANT)
    const { data: adminData, error: dbError } = await supabaseServiceRole
      .from('administradoras').select('token_superlogica_app, token_superlogica_api').eq('subdominio', subdomain).single();

    if (dbError || !adminData?.token_superlogica_app || !adminData?.token_superlogica_api) {
        console.error(`Erro ao buscar tokens para ${subdomain} em /obter-link-pdf:`, dbError?.message);
        throw new Error('Erro interno [Admin Auth failed].');
    }
    const appToken = decryptToken(adminData.token_superlogica_app);
    const apiToken = decryptToken(adminData.token_superlogica_api);
    
    // 5. Formatar datas e chamar Superlógica (Usando os tokens corretos)
    const [dia, mes, ano] = vencimento.split('/');
    const dataVencimentoFormatada = `${mes}/${dia}/${ano}`;
    const dataAtualizacaoFormatada = dataVencimentoFormatada; 

    const url = `https://api.superlogica.net/v2/condor/cobranca/gerarlinksegundavia?ID_CONDOMINIO_COND=${idCondominio}&ID_RECEBIMENTO_RECB=${idBoleto}&DT_VENCIMENTO_RECB=${dataVencimentoFormatada}&DT_ATUALIZACAO_VENCIMENTO=${dataAtualizacaoFormatada}`;

    let responseSuperlogica;
    try {
        responseSuperlogica = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // USANDO OS TOKENS DESCRIPTOGRAFADOS
            'app_token': appToken, 
            'access_token': apiToken,
          },
          redirect: 'manual' // Importante para capturar redirects
        });
    } catch (networkError: any) {
        console.error(`Erro de REDE ao acessar ${url}:`, networkError);
        throw new Error(`Erro de rede ao gerar link do PDF: ${networkError.message}`);
    }

    // 6. Tratar resposta (Redirect)
    if (responseSuperlogica.status >= 300 && responseSuperlogica.status < 400) {
        const directLink = responseSuperlogica.headers.get('Location');
        if (directLink) {
            console.log("Enviando link do redirect para o frontend:", directLink);
            return NextResponse.json({ linkPDF: directLink });
        } else {
             throw new Error('API redirecionou, mas não forneceu um link.');
        }
    }
    
    let responseText = '';
    try { responseText = await responseSuperlogica.text(); } 
    catch(readError) { throw new Error(`Erro ao ler resposta da API ao gerar link.`); }

    // 7. Tratar resposta (200 OK - Texto)
    if (responseSuperlogica.ok) {
        console.log(`Resposta 200 OK (TEXTO Bruto) da Superlógica (/gerarlinksegundavia): "${responseText}"`); 
        let linkText = responseText.replace(/^"|"$/g, '').replace(/\\\//g, '/'); 
        console.log("Texto do link após limpeza:", linkText);

        if (linkText && linkText.startsWith('http')) {
             console.log("Enviando link (limpo) para o frontend:", linkText);
             return NextResponse.json({ linkPDF: linkText });
        } else {
            throw new Error('Não foi possível extrair um link válido do PDF da resposta da API.'); 
        }
    }
    
    // 8. Tratar outros erros
    console.error(`Erro ao gerar link do PDF (Status ${responseSuperlogica.status}). Resposta: ${responseText}`);
    throw new Error(`Não foi possível gerar o link para o PDF (Status: ${responseSuperlogica.status}).`);

  } catch (error: any) { 
    console.error("Erro GERAL na API obter-link-pdf:", error);
    const status = (error.message || '').includes('Token') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Erro no servidor ao obter link do PDF.' }, { status: status });
  }
}
