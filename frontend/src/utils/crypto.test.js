import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptText, decryptText, generateMasterPassword, validatePassword } from './crypto.js';

// Mock the i18n t function
vi.mock('../i18n.js', () => ({
    t: (key, params) => {
        if (params) {
            return `${key} ${JSON.stringify(params)}`;
        }
        return key;
    }
}));

// Mock Web Crypto API
const mockCrypto = {
    subtle: {
        importKey: vi.fn().mockResolvedValue('mockKeyMaterial'),
        deriveKey: vi.fn().mockResolvedValue('mockDerivedKey'),
        encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    },
    getRandomValues: vi.fn().mockImplementation(arr => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }),
};
Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
});


describe('crypto utilities', () => {
    const password = 'testpassword';
    const text = 'hello world';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('encryptText and decryptText', () => {
        it('should encrypt and then decrypt text successfully', async () => {
            const encryptedText = await encryptText(text, password);
            expect(typeof encryptedText).toBe('string');

            // For the mock, we can't truly decrypt, so we'll just test the flow
            const decryptedText = await decryptText(encryptedText, password);
            const decoder = new TextDecoder();
            expect(decryptedText).toBe(decoder.decode(new ArrayBuffer(8)));
        });

        it('encryptText should throw an error if text or password is not provided', async () => {
            await expect(encryptText('', password)).rejects.toThrow('Text and password are required');
            await expect(encryptText(text, '')).rejects.toThrow('Text and password are required');
        });

        it('decryptText should throw an error if encryptedText or password is not provided', async () => {
            await expect(decryptText('', password)).rejects.toThrow('Encrypted text and password are required');
            await expect(decryptText('someencryptedtext', '')).rejects.toThrow('Encrypted text and password are required');
        });

        it('should handle encryption failure', async () => {
            mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));
            await expect(encryptText(text, password)).rejects.toThrow('security.encryptionFailed');
        });

        it('should handle decryption failure', async () => {
            mockCrypto.subtle.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));
            const encrypted = "c2FsdGl2ZW5jcnlwdGVkZGF0YQ=="; // dummy base64
            await expect(decryptText(encrypted, password)).rejects.toThrow('security.decryptionFailed');
        });
    });

    describe('generateMasterPassword', () => {
        it('should generate a password of length 32', () => {
            const masterPassword = generateMasterPassword();
            expect(masterPassword).toBeDefined();
            expect(typeof masterPassword).toBe('string');
            expect(masterPassword.length).toBe(32);
        });

        it('should generate a different password each time', () => {
            const pw1 = generateMasterPassword();
            const pw2 = generateMasterPassword();
            expect(pw1).not.toBe(pw2);
        });
    });

    describe('validatePassword', () => {
        it('should fail if password is too short', () => {
            const result = validatePassword('abc');
            expect(result.isValid).toBe(false);
            expect(result.length).toBe(false);
            expect(result.message).toBe('security.passwordTooShort {"minLength":8}');
        });

        it('should fail if password is not complex enough', () => {
            const result = validatePassword('password');
            expect(result.isValid).toBe(false);
            expect(result.strength).toBe(1);
            expect(result.message).toBe('security.passwordNotComplex');
        });

        it('should fail if password is not complex enough', () => {
            const result = validatePassword('Password');
            expect(result.isValid).toBe(false);
            expect(result.strength).toBe(2);
            expect(result.message).toBe('security.passwordNotComplex');
        });

        it('should pass for a strong password', () => {
            const result = validatePassword('Password123!');
            expect(result.isValid).toBe(true);
            expect(result.length).toBe(true);
            expect(result.strength).toBe(4);
            expect(result.message).toBe('security.passwordStrong');
        });

        it('should pass with 3 of 4 complexity requirements', () => {
            const result = validatePassword('Password123');
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe(3);
        });
    });
});
