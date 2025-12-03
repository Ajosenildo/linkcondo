import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { supabaseServiceRole } from '@/utils/supabase/service'

// Interface para os dados do CSV (AGORA COM A REFERÊNCIA)
interface ContatoCSVRow {
  id_condominio: string;
  nome_condominio_referencia: string; // <-- NOVO CAMPO
  name: string;
  email: string;
  phone: string;
}

// O parser agora usa ponto-e-vírgula (;) e procura o novo campo
function parseCSV(csvText: string): ContatoCSVRow[] {
  const rows = csvText.split('\n');
  if (rows.length === 0) return [];
  
  // Usamos ponto-e-vírgula (;) como separador padrão
  const separator = csvText.includes(';') ? ';' : ','; 
  
  const headers = rows[0].split(separator).map(h => h.trim());
  const data: ContatoCSVRow[] = [];

  // Encontra os índices das colunas
  const idxIdCondominio = headers.indexOf('id_condominio');
  const idxNomeReferencia = headers.indexOf('nome_condominio_referencia'); // <-- NOVO
  const idxName = headers.indexOf('name');
  const idxEmail = headers.indexOf('email');
  const idxPhone = headers.indexOf('phone');

  // Validação básica do cabeçalho
  if (idxIdCondominio === -1) {
    console.error('Cabeçalhos encontrados:', headers);
    throw new Error("O arquivo CSV deve conter uma coluna chamada 'id_condominio'. Verifique o separador (deve ser ',' ou ';') e o nome da coluna.");
  }

  // Processa as linhas de dados (começa do 1 para pular o cabeçalho)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    const values = row.split(separator).map(v => v.trim());
    
    const contato: ContatoCSVRow = {
      id_condominio: values[idxIdCondominio] || '',
      nome_condominio_referencia: values[idxNomeReferencia] || '', // <-- NOVO
      name: values[idxName] || '',
      email: values[idxEmail] || '',
      phone: values[idxPhone] || '',
    };

    // Só adiciona se o id_condominio não estiver vazio
    if (contato.id_condominio) {
      data.push(contato);
    }
  }
  return data;
}


// --- Rota POST (Recebe a planilha) ---
export async function POST(request: NextRequest) {
  // Correção do 'cookies()'
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Verificar se é o admin (segurança)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
  }

  try {
    // 2. Obter os dados do formulário (FormData)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const administradoraId = formData.get('administradora_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }
    if (!administradoraId) {
      return NextResponse.json({ error: 'ID da administradora não fornecido.' }, { status: 400 })
    }

    // 3. Ler o conteúdo do arquivo
    const fileText = await file.text()

    // 4. Processar o CSV (agora com o parser corrigido)
    const contatosParaImportar = parseCSV(fileText);
    
    if (contatosParaImportar.length === 0) {
       return NextResponse.json({ error: 'O arquivo CSV está vazio ou mal formatado. Nenhum dado foi importado.' }, { status: 400 })
    }

    // 5. Preparar os dados para o Supabase (adiciona o 'link')
    const contatosComAdminId = contatosParaImportar.map(contato => ({
      id_condominio: contato.id_condominio,
      nome_condominio_referencia: contato.nome_condominio_referencia, // <-- NOVO
      name: contato.name,
      email: contato.email,
      phone: contato.phone,
      administradora_id: parseInt(administradoraId) // <- O "LINK"
    }));

    // 6. --- TRANSAÇÃO DE IMPORTAÇÃO ---
    // A. Deleta TODOS os contatos antigos desta administradora
    console.log(`Deletando contatos antigos da admin ID: ${administradoraId}...`)
    const { error: deleteError } = await supabaseServiceRole
      .from('contatos_juridicos')
      .delete()
      .eq('administradora_id', administradoraId)

    if (deleteError) {
      console.error('Erro ao deletar contatos antigos:', deleteError)
      throw new Error(`Falha ao limpar contatos antigos: ${deleteError.message}`)
    }

    // B. Insere TODOS os novos contatos da planilha
    console.log(`Inserindo ${contatosComAdminId.length} novos contatos...`)
    const { error: insertError } = await supabaseServiceRole
      .from('contatos_juridicos')
      .insert(contatosComAdminId)

    if (insertError) {
      console.error('Erro ao inserir novos contatos:', insertError)
      throw new Error(`Falha ao inserir novos contatos: ${insertError.message}`)
    }

    // 7. Sucesso!
    return NextResponse.json({ message: `Sucesso! ${contatosComAdminId.length} contatos foram importados.` })

  } catch (err: any) {
    console.error('Erro na API de importação:', err.message)
    // Envia a mensagem de erro real (ex: "coluna faltando") para o frontend
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}