import CryptoJS from 'crypto-js';

export function decryptPermissions(encryptedText) {
  if (!encryptedText) {
    throw new Error('Encrypted text cannot be empty');
  }

  try {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    const encryptionSalt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT;

    if (!encryptionKey || !encryptionSalt) {
      throw new Error('Encryption key or salt not configured');
    }

    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const iv = CryptoJS.enc.Hex.parse(encryptionSalt);
    const encrypted = CryptoJS.enc.Hex.parse(encryptedText);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encrypted },
      key,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new Error('Decryption returned empty string');
    }

    const permissions = JSON.parse(decryptedText);

    if (!Array.isArray(permissions)) {
      throw new Error('Decrypted permissions is not an array');
    }

    return permissions;
  } catch (error) {
    throw error;
  }
}
