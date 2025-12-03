// src/utils/supabase/service.ts (ou admin.ts)
import { createClient } from '@supabase/supabase-js';

// Lê as variáveis de ambiente (URL pública e a chave de SERVIÇO secreta)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('!!! Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas !!!');
    // Em produção, isso deve gerar um erro crítico
}

// Cria um cliente Supabase que usa a CHAVE DE SERVIÇO.
// CUIDADO: Este cliente tem acesso total ao seu banco, bypassando RLS.
// Use apenas em ambientes seguros de backend (API Routes, Server Actions).
export const supabaseServiceRole = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      // Impede que o cliente tente gerenciar sessões de usuário
      autoRefreshToken: false,
      persistSession: false
    }
});

// Opcional: Você pode exportar uma função em vez do cliente direto para mais controle
// export const createAdminClient = () => {
//     if (!supabaseUrl || !supabaseServiceKey) {
//         throw new Error('Supabase admin config missing');
//     }
//     return createClient(supabaseUrl, supabaseServiceKey, { auth: { /*...*/ } });
// }