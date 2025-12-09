/**
 * Biblioteca de Criptografia Unicode com Homoglyphs
 * 
 * Converte texto para versão "cripto estilizada" usando caracteres Unicode
 * semelhantes aos caracteres latinos originais (homoglyphs).
 * 
 * O texto permanece legível para humanos, apenas visualmente estilizado.
 * Usa caracteres de alfabetos como cirílico, grego, georgiano, fonéticos e símbolos compatíveis.
 */

// Mapeamento de caracteres latinos para homoglyphs
const HOMOGLYPH_MAP: Record<string, string> = {
  // Vogais minúsculas
  'a': 'а', // cirílico
  'e': 'е', // cirílico
  'i': 'і', // cirílico
  'o': 'о', // cirílico
  'u': 'υ', // grego upsilon
  'y': 'у', // cirílico
  
  // Vogais maiúsculas
  'A': 'А', // cirílico
  'E': 'Е', // cirílico
  'I': 'І', // cirílico
  'O': 'О', // cirílico
  'U': 'Υ', // grego
  'Y': 'У', // cirílico
  
  // Consoantes minúsculas
  'b': 'Ь', // cirílico (soft sign)
  'c': 'с', // cirílico
  'd': 'ԁ', // cirílico
  'f': 'ƒ', // fonético
  'g': 'ɡ', // fonético
  'h': 'һ', // cirílico
  'j': 'ј', // cirílico
  'k': 'к', // cirílico
  'l': 'ӏ', // cirílico
  'm': 'м', // cirílico
  'n': 'п', // cirílico (parece n)
  'p': 'р', // cirílico
  'q': 'ԛ', // cirílico
  'r': 'г', // cirílico
  's': 'ѕ', // cirílico
  't': 'т', // cirílico
  'v': 'ν', // grego nu
  'w': 'ω', // grego omega
  'x': 'х', // cirílico
  'z': 'ᴢ', // fonético
  
  // Consoantes maiúsculas
  'B': 'В', // cirílico
  'C': 'С', // cirílico
  'D': 'Ԁ', // cirílico
  'F': 'Ғ', // cirílico
  'G': 'Ԍ', // cirílico
  'H': 'Н', // cirílico
  'J': 'Ј', // cirílico
  'K': 'К', // cirílico
  'L': 'ӏ', // cirílico
  'M': 'М', // cirílico
  'N': 'Ν', // grego
  'P': 'Р', // cirílico
  'Q': 'Ԛ', // cirílico
  'R': 'Я', // cirílico (parece R invertido)
  'S': 'Ѕ', // cirílico
  'T': 'Т', // cirílico
  'V': 'Ѵ', // cirílico
  'W': 'Ԝ', // cirílico
  'X': 'Х', // cirílico
  'Z': 'Ζ', // grego
}

/**
 * Criptografa um texto convertendo para homoglyphs
 * 
 * @param text - Texto a ser criptografado
 * @returns Texto criptografado com homoglyphs
 * 
 * @example
 * encryptText("ola eu sou emen") // Retorna "о​ӏ​а​ ​г​е​υ​ ​ѕ​о​υ​ ​е​м​е​п​"
 */
export function encryptText(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Texto inválido. Deve ser uma string não vazia.')
  }

  // Se o texto começar com "NORMAL:", retornar sem estilizar
  if (text.trim().startsWith('NORMAL:')) {
    return text.replace(/^NORMAL:\s*/, '')
  }

  try {
    // Converter cada caractere para homoglyph se disponível
    const encrypted = text.split('').map(char => {
      // Se existe mapeamento, usar homoglyph
      if (HOMOGLYPH_MAP[char]) {
        return HOMOGLYPH_MAP[char]
      }
      // Caso contrário, manter o caractere original (espaços, pontuação, números, etc.)
      return char
    })

    return encrypted.join('')
  } catch (error) {
    throw new Error('Erro ao criptografar texto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
  }
}

/**
 * Descriptografa um texto convertendo homoglyphs de volta para caracteres latinos
 * 
 * @param encryptedText - Texto criptografado com homoglyphs
 * @returns Texto descriptografado (original)
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Texto criptografado inválido. Deve ser uma string não vazia.')
  }

  try {
    // Criar mapeamento reverso
    const reverseMap: Record<string, string> = {}
    for (const [original, homoglyph] of Object.entries(HOMOGLYPH_MAP)) {
      reverseMap[homoglyph] = original
    }

    // Converter cada caractere de volta
    const decrypted = encryptedText.split('').map(char => {
      // Se existe mapeamento reverso, usar caractere original
      if (reverseMap[char]) {
        return reverseMap[char]
      }
      // Caso contrário, manter o caractere (espaços, pontuação, números, etc.)
      return char
    })

    return decrypted.join('')
  } catch (error) {
    throw new Error('Erro ao descriptografar texto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
  }
}

/**
 * Verifica se um texto está criptografado com homoglyphs
 * 
 * @param text - Texto a verificar
 * @returns true se o texto contém homoglyphs, false caso contrário
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  // Verificar se contém caracteres que são homoglyphs
  const homoglyphs = Object.values(HOMOGLYPH_MAP)
  return text.split('').some(char => homoglyphs.includes(char))
}

/**
 * Criptografa um texto apenas se a opção estiver ativada
 * 
 * @param text - Texto a ser processado
 * @param encrypt - Se true, criptografa; se false, retorna o texto original
 * @returns Texto criptografado ou original
 */
export function encryptIfEnabled(text: string, encrypt: boolean): string {
  if (!encrypt) {
    return text
  }
  return encryptText(text)
}

/**
 * Descriptografa um texto apenas se estiver criptografado
 * 
 * @param text - Texto a ser processado
 * @returns Texto descriptografado ou original
 */
export function decryptIfNeeded(text: string): string {
  if (isEncrypted(text)) {
    return decryptText(text)
  }
  return text
}
