import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-32-character-key-change-me!";
const ALGORITHM = "aes-256-cbc";

// Ensure the key is exactly 32 bytes
const getKey = () => {
    const key = Buffer.from(ENCRYPTION_KEY);
    if (key.length !== 32) {
        // Pad or truncate to 32 bytes
        const paddedKey = Buffer.alloc(32);
        key.copy(paddedKey);
        return paddedKey;
    }
    return key;
};

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
