import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomBytes, createCipheriv, createDecipheriv } from 'react-native-quick-crypto';
import { Buffer } from 'buffer';


const ENCRYPTION_KEY = Config.encription_key || 'fallback_key_32chars_long_____';
// Ensure the key is 32 bytes long for AES-256
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '_').slice(0, 32));

// Encrypt a string
export const encrypt = (text: string): string => {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

// Decrypt a string
export const decrypt = (text: string): string => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Encrypt a key
export const encryptKey = (key: string): string => {
    return encrypt(key);
};

// Decrypt a key
export const decryptKey = (encryptedKey: string): string => {
    return decrypt(encryptedKey);
};

// Encrypt and store data in AsyncStorage
export const encryptAndStore = async (key: string, value: string): Promise<void> => {
    const encryptedKey = encryptKey(key);
    const encryptedValue = encrypt(value);
    await AsyncStorage.setItem(encryptedKey, encryptedValue);
};

// Retrieve and decrypt data from AsyncStorage
export const retrieveAndDecrypt = async (key: string): Promise<string | null> => {
    const encryptedKey = encryptKey(key);
    const encryptedValue = await AsyncStorage.getItem(encryptedKey);
    if (encryptedValue) {
        return decrypt(encryptedValue);
    }
    return null;
};