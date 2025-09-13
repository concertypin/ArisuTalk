import { t } from "../i18n.js";

/**
 * Crypto utilities for secure API key storage
 * Uses Web Crypto API for encryption/decryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a cryptographic key from a password
 * @param {string} password - User password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // 높은 보안을 위한 반복 횟수
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generate random salt
 * @returns {Uint8Array} - Random salt
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate random IV
 * @returns {Uint8Array} - Random IV
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypt text using AES-GCM
 * @param {string} text - Text to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} - Base64 encoded encrypted data
 */
export async function encryptText(text, password) {
  if (!text || !password) {
    throw new Error("Text and password are required");
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(password, salt);

    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      data,
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedData.byteLength,
    );
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error(t("security.encryptionFailed"));
  }
}

/**
 * Decrypt text using AES-GCM
 * @param {string} encryptedText - Base64 encoded encrypted text
 * @param {string} password - Password for decryption
 * @returns {Promise<string>} - Decrypted text
 */
export async function decryptText(encryptedText, password) {
  if (!encryptedText || !password) {
    throw new Error("Encrypted text and password are required");
  }

  try {
    const combined = new Uint8Array(
      atob(encryptedText)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const encryptedData = combined.slice(16 + IV_LENGTH);

    const key = await deriveKey(password, salt);

    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      encryptedData,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(t("security.decryptionFailed"));
  }
}

/**
 * Generate a random master password
 * @returns {string} - Random master password
 */
export function generateMasterPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the password is valid
 * @property {boolean} length - Whether the password meets length requirement
 * @property {number} strength - Strength score (0-4)
 * @property {string} message - Validation message
 *
 * @returns {ValidationResult} - Validation result
 */
export function validatePassword(password) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;

  return {
    isValid: password.length >= minLength && strength >= 3,
    length: password.length >= minLength,
    strength: strength,
    message:
      password.length < minLength
        ? t("security.passwordTooShort", { minLength })
        : strength < 3
        ? t("security.passwordNotComplex")
        : t("security.passwordStrong"),
  };
}
