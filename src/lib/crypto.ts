import CryptoJS from "crypto-js";

// Note: In a production app, the encryption key should be securely handled.
// Using an environment variable for simplicity in this implementation.
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "fallback-secret-key-12345";

export function encryptPassword(password: string): string {
  if (!password) return "";
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
}

export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Failed to decrypt password", e);
    return "Decryption Error";
  }
}
