/**
 * Testes para a biblioteca de criptografia Unicode
 * 
 * Execute com: npm test ou npx jest
 */

import { encryptText, decryptText, isEncrypted, encryptIfEnabled, decryptIfNeeded } from '../unicode-crypto'

describe('Unicode Crypto', () => {
  describe('encryptText', () => {
    it('deve criptografar texto simples', () => {
      const text = 'Hello'
      const encrypted = encryptText(text)
      expect(encrypted).toBe('\\u0048\\u0065\\u006c\\u006c\\u006f')
    })

    it('deve criptografar texto com espaços', () => {
      const text = 'Hello World'
      const encrypted = encryptText(text)
      expect(encrypted).toContain('\\u0020') // Espaço em Unicode
    })

    it('deve criptografar texto com caracteres especiais', () => {
      const text = 'Olá! @#$%'
      const encrypted = encryptText(text)
      expect(encrypted).toContain('\\u')
    })

    it('deve criptografar texto vazio', () => {
      const text = ''
      const encrypted = encryptText(text)
      expect(encrypted).toBe('')
    })

    it('deve lançar erro para entrada inválida', () => {
      expect(() => encryptText(null as any)).toThrow()
      expect(() => encryptText(undefined as any)).toThrow()
    })
  })

  describe('decryptText', () => {
    it('deve descriptografar texto Unicode', () => {
      const encrypted = '\\u0048\\u0065\\u006c\\u006c\\u006f'
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe('Hello')
    })

    it('deve descriptografar texto com espaços', () => {
      const encrypted = '\\u0048\\u0065\\u006c\\u006c\\u006f\\u0020\\u0057\\u006f\\u0072\\u006c\\u0064'
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe('Hello World')
    })

    it('deve retornar texto original se não estiver criptografado', () => {
      const text = 'Hello'
      const decrypted = decryptText(text)
      expect(decrypted).toBe('Hello')
    })

    it('deve descriptografar texto vazio', () => {
      const encrypted = ''
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe('')
    })
  })

  describe('isEncrypted', () => {
    it('deve retornar true para texto criptografado', () => {
      const encrypted = '\\u0048\\u0065\\u006c\\u006c\\u006f'
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('deve retornar false para texto normal', () => {
      const text = 'Hello'
      expect(isEncrypted(text)).toBe(false)
    })

    it('deve retornar false para string vazia', () => {
      expect(isEncrypted('')).toBe(false)
    })
  })

  describe('encryptIfEnabled', () => {
    it('deve criptografar quando ativado', () => {
      const text = 'Hello'
      const result = encryptIfEnabled(text, true)
      expect(result).toBe('\\u0048\\u0065\\u006c\\u006c\\u006f')
    })

    it('deve retornar original quando desativado', () => {
      const text = 'Hello'
      const result = encryptIfEnabled(text, false)
      expect(result).toBe('Hello')
    })
  })

  describe('decryptIfNeeded', () => {
    it('deve descriptografar quando necessário', () => {
      const encrypted = '\\u0048\\u0065\\u006c\\u006c\\u006f'
      const result = decryptIfNeeded(encrypted)
      expect(result).toBe('Hello')
    })

    it('deve retornar original quando não criptografado', () => {
      const text = 'Hello'
      const result = decryptIfNeeded(text)
      expect(result).toBe('Hello')
    })
  })

  describe('Ciclo completo de criptografia/descriptografia', () => {
    it('deve criptografar e descriptografar corretamente', () => {
      const original = 'Hello World! @#$%'
      const encrypted = encryptText(original)
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe(original)
    })

    it('deve funcionar com texto em português', () => {
      const original = 'Olá, como vai você?'
      const encrypted = encryptText(original)
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe(original)
    })

    it('deve funcionar com números', () => {
      const original = '1234567890'
      const encrypted = encryptText(original)
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe(original)
    })

    it('deve funcionar com texto longo', () => {
      const original = 'Este é um texto muito longo que precisa ser criptografado corretamente.'
      const encrypted = encryptText(original)
      const decrypted = decryptText(encrypted)
      expect(decrypted).toBe(original)
    })
  })
})



