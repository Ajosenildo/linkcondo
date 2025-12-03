// Este é um script de uso único.
// 1. Crie este arquivo na raiz do seu projeto 'acesso-boletos-frontend'
// 2. Preencha os tokens reais da Superlógica abaixo.
// 3. Rode no terminal: npx ts-node gerarTokens.ts
// 4. Copie os tokens criptografados que aparecerão no terminal.

// --- CORREÇÃO 1: CARREGAR O ARQUIVO .env.local ---
// Diz ao dotenv para carregar o arquivo .env.local especificamente.
const dotenvResult = require('dotenv').config({ path: '.env.local' });

if (dotenvResult.error) {
    console.error("ERRO: Não foi possível carregar o arquivo '.env.local'.");
    console.error("Verifique se o arquivo existe na raiz do projeto.");
    throw dotenvResult.error;
}
console.log("Arquivo .env.local carregado com sucesso.");
// --- FIM DA CORREÇÃO 1 ---

// --- CORREÇÃO 2: IMPORTAR O cryptoUtils *DEPOIS* do dotenv ---
// Isso garante que process.env.ENCRYPTION_KEY já existe ANTES do
// cryptoUtils tentar lê-lo.
const { encryptToken } = require('./src/lib/cryptoUtils');
// --- FIM DA CORREÇÃO 2 ---

// --- PREENCHA AQUI COM SEUS TOKENS REAIS ---
const MEU_APP_TOKEN_SUPERLOGICA = "7a5ccc5d-413d-485e-90b4-114bebcf119c";
const MEU_API_TOKEN_SUPERLOGICA = "8b48b661-ea4c-4e3f-8a46-3032e29fbc3a";
// --- FIM DO PREENCHIMENTO ---

// Verifica se a ENCRYPTION_KEY foi carregada (AGORA VAI FUNCIONAR)
if (!process.env.ENCRYPTION_KEY) {
    console.error("ERRO: 'ENCRYPTION_KEY' não encontrada no arquivo .env.local");
    console.error("Certifique-se que seu .env.local está correto antes de rodar este script.");
    process.exit(1); // Para a execução
}

try {
    console.log("Criptografando tokens...");

    // Correção para o erro TS2367
    if ((MEU_APP_TOKEN_SUPERLOGICA as any) === "SEU_TOKEN_APP_REAL_AQUI" || (MEU_API_TOKEN_SUPERLOGICA as any) === "SEU_TOKEN_API_REAL_AQUI") {
         console.error("\nERRO: Por favor, edite o arquivo 'gerarTokens.ts' e preencha");
         console.error("as variáveis MEU_APP_TOKEN_SUPERLOGICA e MEU_API_TOKEN_SUPERLOGICA com seus tokens reais ANTES de rodar o script.");
         process.exit(1);
    }

    const tokenAppCriptografado = encryptToken(MEU_APP_TOKEN_SUPERLOGICA);
    const tokenApiCriptografado = encryptToken(MEU_API_TOKEN_SUPERLOGICA);

    console.log("\n--- SUCESSO! Tokens Criptografados Gerados ---");
    console.log("\nCopie estas saídas e guarde-as para o Passo 2 (SQL).\n");

    console.log("TOKEN_APP_CRIPTOGRAFADO:");
    console.log(tokenAppCriptografado);
    
    console.log("\nTOKEN_API_CRIPTOGRAFADO:");
    console.log(tokenApiCriptografado);

    console.log("\n------------------------------------------------");

} catch (error: any) {
    console.error("\n--- ERRO AO CRIPTOGRAFAR ---");
    console.error("Verifique se sua 'ENCRYPTION_KEY' no .env.local está correta.");
    console.error("Detalhes:", error.message);
}