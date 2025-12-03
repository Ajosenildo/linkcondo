// src/lib/cryptoUtils.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Padrão recomendado para GCM
const AUTH_TAG_LENGTH = 16; // Padrão para GCM
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // Carrega a chave do .env

if (KEY.length !== 32) {
    throw new Error('Chave de criptografia inválida. ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes).');
}

export function encryptToken(text: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH); // Gera um IV único para cada criptografia
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        // Combina IV, AuthTag e Criptograma (hex) para armazenamento
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error("Erro ao criptografar:", error);
        throw new Error("Falha na criptografia do token.");
    }
}

export function decryptToken(encryptedText: string): string {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato do texto criptografado inválido.');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
            throw new Error('Componentes do texto criptografado têm tamanhos inválidos.');
        }
        
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag); // Define a tag de autenticação

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error: any) {
        console.error("Erro ao descriptografar:", error);
        // Verifica se o erro é de tag inválida (tentativa de violação ou chave errada)
        if (error.message.includes('Unsupported state or unable to authenticate data')) {
             throw new Error("Falha na autenticação do token criptografado. Chave incorreta ou dados corrompidos.");
        }
        throw new Error("Falha na descriptografia do token.");
    }
}