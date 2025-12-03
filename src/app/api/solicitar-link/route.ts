// ARQUIVO FINAL (V5 - Remetente Genérico): src/app/api/solicitar-link/route.ts
// ATUALIZADO: Alterado e-mail remetente para @iadev.app (mais genérico e escalável).

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import { supabaseServiceRole } from '@/utils/supabase/service';
import { decryptToken } from '@/lib/cryptoUtils';

const resend = new Resend(process.env.RESEND_API_KEY);
const normalizeEmail = (email: string) => email ? email.trim().toLowerCase() : '';

interface UnitInfo {
  idCondominio: string;
  nomeCondominio: string;
  idUnidade: string;
  unidade: string; 
}

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
  try {
      responseText = await response.text();
  } catch (readError: any) {
      console.error(`Erro ao LER a resposta como texto de ${url}:`, readError);
      throw new Error(`Erro ao ler resposta da Superlógica.`);
  }

  if (!response.ok) {
    console.error(`Erro ${response.status} da API Superlógica em ${url}. Resposta: ${responseText}`);
    if (response.status === 404) {
        console.warn(`API retornou 404 para ${url}, tratando como nenhuma unidade encontrada.`);
        return []; 
    }
    throw new Error(`Falha na comunicação com o sistema (${response.status}).`);
  }

  try {
    if (responseText.trim() === '') {
        console.log(`Resposta da Superlógica para ${url} foi string vazia.`);
        return [];
    }
    const data = JSON.parse(responseText);
    if (Array.isArray(data)) {
        return data;
    } else {
        if (typeof data === 'object' && data !== null) {
            return [data];
        }
        return []; 
    }
  } catch (jsonError: any) {
     console.error(`Erro ao PARSEAR JSON da resposta de ${url} (Texto: ${responseText}):`, jsonError);
     throw new Error(`Resposta inválida recebida do sistema.`);
  }
}

// Rota POST Principal
export async function POST(request: NextRequest) {
  try { 
    const { email, subdomain, acao } = await request.json();
    const emailSolicitado = normalizeEmail(email);

    if (!emailSolicitado || !subdomain || !acao) {
        console.log("Requisição recebida sem e-mail, subdomínio ou ação.");
        return NextResponse.json({ error: 'E-mail, identificador da administradora e ação são obrigatórios.' }, { status: 400 });
    }
    console.log(`Solicitação para Subdomínio: ${subdomain}, E-mail: ${emailSolicitado}, Ação: ${acao}`);

    // 1. Buscar dados da administradora
    const { data: adminData, error: dbError } = await supabaseServiceRole
      .from('administradoras')
      .select('token_superlogica_app, token_superlogica_api, nome_empresa')
      .eq('subdominio', subdomain)
      .single();

    if (dbError || !adminData) {
        console.error(`Erro ao buscar administradora para subdomínio "${subdomain}":`, dbError?.message);
        return NextResponse.json({ message: 'Se o seu e-mail estiver cadastrado, você receberá um link em breve.' });
    }
    if (!adminData.token_superlogica_app || !adminData.token_superlogica_api) {
         console.error(`Administradora "${subdomain}" encontrada, mas tokens da Superlógica não configurados no banco.`);
         return NextResponse.json({ error: 'Erro interno de configuração [Admin Tokens Missing].' }, { status: 500 });
    }

    // 2. Descriptografar os tokens
    let appToken: string;
    let apiToken: string;
    try {
        appToken = decryptToken(adminData.token_superlogica_app);
        apiToken = decryptToken(adminData.token_superlogica_api);
        console.log(`Tokens descriptografados com sucesso para ${subdomain}`);
    } catch (decryptError: any) {
         console.error(`Erro ao descriptografar tokens para ${subdomain}:`, decryptError.message);
         return NextResponse.json({ error: 'Erro interno de segurança [Decrypt Failed].' }, { status: 500 });
    }

    // 3. Buscar unidades na Superlógica
    console.log(`Buscando unidades para ${emailSolicitado} (Tenant: ${subdomain})...`);
    const urlBuscaUnica = `https://api.superlogica.net/v2/condor/unidades/index?idCondominio=-1&pesquisa=${emailSolicitado}&exibirDadosDosContatos=1`;
    const unidadesEncontradasRaw = await fetchSuperlogicaAPI(urlBuscaUnica, appToken, apiToken);

    if (unidadesEncontradasRaw === null || unidadesEncontradasRaw.length === 0) {
        console.log(`Nenhuma unidade encontrada para ${emailSolicitado} no tenant ${subdomain}.`);
        return NextResponse.json({ message: 'Se o seu e-mail estiver cadastrado, você receberá um link em breve.' });
    }

    // 4. Filtrar e validar
    const unidadesValidadas: UnitInfo[] = unidadesEncontradasRaw
      .filter((unidade: any) => 
        unidade.contatos?.some((contato: any) => 
          contato.st_email_con?.split(';').map(normalizeEmail).includes(emailSolicitado)
        )
      )
      .map((unidade: any) => ({
        idCondominio: unidade.id_condominio_cond,
        nomeCondominio: unidade.st_nome_cond || `Condomínio ID ${unidade.id_condominio_cond}`, 
        idUnidade: unidade.id_unidade_uni,
        unidade: `${unidade.st_unidade_uni || ''} ${unidade.st_bloco_uni || ''}`.trim()
      }));

    if (unidadesValidadas.length === 0) {
      console.log(`Busca por e-mail retornou ${unidadesEncontradasRaw.length} unidade(s), mas nenhuma passou na validação final para: ${emailSolicitado}.`);
      return NextResponse.json({ message: 'Se o seu e-mail estiver cadastrado, você receberá um link em breve.' });
    }

    // 5. Gerar token JWT
    console.log(`Gerando token para ${unidadesValidadas.length} unidade(s) validadas (Tenant: ${subdomain})...`);
    
    const payload = { 
        unidades: unidadesValidadas, 
        subdomain: subdomain,
        acao: acao
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });

    const requestHost = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const domain = `${protocol}://${requestHost}`;
    
    const magicLink = `${domain}/portal?token=${token}`; 
    console.log(`Link mágico gerado: ${magicLink}`);

    // 6. Enviar e-mail
    console.log(`Enviando e-mail para ${emailSolicitado} (Tenant: ${subdomain})...`);
    const administratorName = adminData.nome_empresa || "Administradora";
    
    const tipoAcesso = acao === 'reservas' ? 'Reservas' : 'Boletos';
    const emailSubject = `LinkCondo - ${tipoAcesso} (${administratorName})`;
    
    const emailHtmlBody = `
      <p>Prezado(a) condômino(a),</p>
      <p>Você está recebendo este e-mail porque solicitou acesso ao <strong>LinkCondo</strong> do seu condomínio (${tipoAcesso}).</p>
      <p><strong><a href="${magicLink}">Clique aqui para acessar.</a></strong></p>
      <p>Este acesso é válido por 15 minutos.</p>
      <br/>
      <p>Atenciosamente,</p>
      <p><strong>${administratorName}</strong></p>
    `;

    const { data, error } = await resend.emails.send({
        // --- MUDANÇA AQUI ---
        from: `LinkCondo <nao-responda@iadev.app>`, 
        // --- FIM DA MUDANÇA ---
        to: emailSolicitado,
        subject: emailSubject,
        html: emailHtmlBody,
    });

    if (error) {
        console.error("Erro ao enviar e-mail pelo Resend:", error);
        throw new Error(`Ocorreu um erro ao tentar enviar o e-mail.`);
    }

    console.log(`E-mail enviado com sucesso (Tenant: ${subdomain}). ID:`, data?.id);
    return NextResponse.json({ message: 'Link de validação de acesso enviado para o seu e-mail com sucesso!' });

  } catch (error: any) { 
    console.error(`Erro GERAL CAPTURADO:`, error);
    return NextResponse.json({ error: error.message || 'Ocorreu um erro inesperado no servidor.' }, { status: 500 });
  }
}