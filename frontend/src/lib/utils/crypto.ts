import { t } from "$root/i18n";

/**
 * Crypto utilities for secure API key storage
 * Uses Web Crypto API for encryption/decryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a cryptographic key from a password
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt:Uint8Array.from(salt),
            iterations: 100000, // 높은 보안을 위한 반복 횟수
            hash: "SHA-256",
        } satisfies Pbkdf2Params,
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Generate random salt
 */
function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate random IV
 */
function generateIV(): Uint8Array {
    // Return a Uint8Array view (ArrayLike<number>) so it can be used with combined.set and Web Crypto APIs
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

function uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
    const arraybuf = new ArrayBuffer(uint8Array.length);
    const view = new Uint8Array(arraybuf);
    view.set(uint8Array);
    return arraybuf;
}
/**
 * Encrypt text using AES-GCM
 */
export async function encryptText(text: string, password: string): Promise<string> {
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
            { name: ALGORITHM, iv: uint8ArrayToArrayBuffer(iv) },
            key,
            data
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(
            salt.length + iv.byteLength + encryptedData.byteLength
        );
        combined.set(salt);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encryptedData), salt.length + iv.byteLength);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error(t("security.encryptionFailed"));
    }
}

/**
 * Decrypt text using AES-GCM
 */
export async function decryptText(encryptedText: string, password: string): Promise<string> {
    if (!encryptedText || !password) {
        throw new Error("Encrypted text and password are required");
    }

    try {
        const combined = new Uint8Array(
            atob(encryptedText)
                .split("")
                .map((c) => c.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 16 + IV_LENGTH);
        const encryptedData = combined.slice(16 + IV_LENGTH);

        const key = await deriveKey(password, salt);

        const decryptedData = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            encryptedData
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
 */
export function generateMasterPassword(): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export interface ValidationResult {
    isValid: boolean;
    length: boolean;
    strength: number;
    message: string;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
        Boolean
    ).length;

    return {
        isValid: password.length >= minLength && strength >= 3,
        length: password.length >= minLength,
        strength: strength,
        message:
            password.length < minLength
                ? t("security.passwordTooShort", { minLength: minLength.toString() })
                : strength < 3
                  ? t("security.passwordNotComplex")
                  : t("security.passwordStrong"),
    };
}
