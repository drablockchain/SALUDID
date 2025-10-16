import CryptoJS from 'crypto-js'

/**
 * Encryption utilities for medical certificate data
 */

/**
 * Generate a random encryption key
 */
export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(256/8).toString()
}

/**
 * Encrypt text data
 */
export const encryptText = (text, password) => {
  try {
    const iv = CryptoJS.lib.WordArray.random(128/8)
    const encrypted = CryptoJS.AES.encrypt(text, password, { iv: iv })
    return {
      encryptedData: encrypted.toString(),
      iv: iv.toString()
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

/**
 * Decrypt text data
 */
export const decryptText = (encryptedData, password, iv) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password, {
      iv: CryptoJS.enc.Hex.parse(iv)
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * Encrypt file content
 */
export const encryptFile = (file, password) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const fileData = reader.result
        const iv = CryptoJS.lib.WordArray.random(128/8)
        const encrypted = CryptoJS.AES.encrypt(
          CryptoJS.lib.WordArray.create(fileData),
          password,
          { iv: iv }
        )
        resolve({
          encryptedData: encrypted.toString(),
          iv: iv.toString()
        })
      } catch (error) {
        reject(new Error(`File encryption failed: ${error.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Decrypt file content
 */
export const decryptFile = (encryptedData, password, iv) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password, {
      iv: CryptoJS.enc.Hex.parse(iv)
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error(`File decryption failed: ${error.message}`)
  }
}

/**
 * Generate hash for data integrity
 */
export const generateHash = (data) => {
  if (typeof data === 'string') {
    return CryptoJS.SHA256(data).toString()
  }
  
  // For file data
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const fileData = reader.result
        const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileData)).toString()
        resolve(hash)
      } catch (error) {
        reject(new Error(`Hash generation failed: ${error.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file for hashing'))
    reader.readAsArrayBuffer(data)
  })
}

/**
 * Hash patient name for privacy
 */
export const hashPatientName = (patientName) => {
  return CryptoJS.SHA256(patientName.toLowerCase().trim()).toString()
}

/**
 * Generate secure random password
 */
export const generateSecurePassword = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length
  
  return {
    score,
    isValid: score >= 3,
    feedback: {
      length: password.length >= minLength ? 'Good length' : `Minimum ${minLength} characters required`,
      uppercase: hasUpperCase ? 'Contains uppercase' : 'Add uppercase letters',
      lowercase: hasLowerCase ? 'Contains lowercase' : 'Add lowercase letters',
      numbers: hasNumbers ? 'Contains numbers' : 'Add numbers',
      special: hasSpecialChar ? 'Contains special characters' : 'Add special characters'
    }
  }
}

/**
 * Create encrypted metadata for IPFS
 */
export const createEncryptedMetadata = (metadata, password) => {
  try {
    const metadataString = JSON.stringify(metadata)
    const { encryptedData, iv } = encryptText(metadataString, password)
    
    return {
      encryptedMetadata: encryptedData,
      iv: iv,
      algorithm: 'AES-256-CBC',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Metadata encryption failed: ${error.message}`)
  }
}

/**
 * Decrypt metadata from IPFS
 */
export const decryptMetadata = (encryptedMetadata, iv, password) => {
  try {
    const decryptedString = decryptText(encryptedMetadata, password, iv)
    return JSON.parse(decryptedString)
  } catch (error) {
    throw new Error(`Metadata decryption failed: ${error.message}`)
  }
}

/**
 * Secure data sanitization
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limit length
}

/**
 * Generate certificate ID
 */
export const generateCertificateId = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `CERT-${timestamp}-${random}`.toUpperCase()
}
