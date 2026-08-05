import crypto from 'crypto'

/**
 * Cifrado de las contraseñas que genera el administrador.
 *
 * AES-256-GCM: además de cifrar, autentica (si alguien altera el dato en la
 * base, el descifrado falla en vez de devolver basura).
 *
 * La llave sale de CREDENTIALS_SECRET y nunca toca la base de datos, así que
 * una fuga del contenido de la tabla no revela ninguna contraseña.
 */

const ALGO = 'aes-256-gcm'

function getKey(): Buffer | null {
  const raw = process.env.CREDENTIALS_SECRET
  if (!raw || raw.length < 16) return null
  // scrypt normaliza cualquier texto a una llave de 32 bytes.
  return crypto.scryptSync(raw, 'ruag-credenciales-v1', 32)
}

export function credencialesDisponibles(): boolean {
  return getKey() !== null
}

export function cifrarPassword(plano: string): { iv: string; tag: string; secreto: string } | null {
  const key = getKey()
  if (!key) return null

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const secreto = Buffer.concat([cipher.update(plano, 'utf8'), cipher.final()])
  return {
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
    secreto: secreto.toString('hex'),
  }
}

export function descifrarPassword(dato: { iv: string; tag: string; secreto: string }): string | null {
  const key = getKey()
  if (!key) return null

  try {
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(dato.iv, 'hex'))
    decipher.setAuthTag(Buffer.from(dato.tag, 'hex'))
    const plano = Buffer.concat([
      decipher.update(Buffer.from(dato.secreto, 'hex')),
      decipher.final(),
    ])
    return plano.toString('utf8')
  } catch {
    // Llave cambiada o dato manipulado.
    return null
  }
}
