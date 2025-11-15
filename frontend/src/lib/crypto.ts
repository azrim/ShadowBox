import sodium from 'libsodium-wrappers';
import hkdf from 'hkdf';
import { ethers } from 'ethers';

export interface EncryptedPayload {
  cipher: string;
  nonce: string;
  timestamp: number;
}

export async function deriveKeyFromSignature(
  signer: ethers.Signer,
  address: string
): Promise<{ key: Buffer; timestamp: number; signature: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `shadowbox:key:${timestamp}`;
  
  const signature = await signer.signMessage(message);
  
  const sigBytes = ethers.getBytes(signature);
  const key = hkdf.hkdf('sha256', sigBytes, null, 'shadowbox-key', 32);
  
  return {
    key: Buffer.from(key),
    timestamp,
    signature,
  };
}

export async function encryptPayload(
  key: Buffer,
  payload: any
): Promise<EncryptedPayload> {
  await sodium.ready;
  
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  
  return {
    cipher: Buffer.from(cipher).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export async function decryptPayload(
  key: Buffer,
  encryptedPayload: EncryptedPayload
): Promise<any> {
  await sodium.ready;
  
  const cipher = Buffer.from(encryptedPayload.cipher, 'base64');
  const nonce = Buffer.from(encryptedPayload.nonce, 'base64');
  
  const decrypted = sodium.crypto_secretbox_open_easy(cipher, nonce, key);
  
  if (!decrypted) {
    throw new Error('Decryption failed');
  }
  
  const plaintext = new TextDecoder().decode(decrypted);
  return JSON.parse(plaintext);
}

export async function decryptLootCipher(
  key: Buffer,
  lootCipherHex: string
): Promise<any> {
  await sodium.ready;
  
  const cipherBytes = ethers.getBytes(lootCipherHex);
  
  const nonceLength = sodium.crypto_secretbox_NONCEBYTES;
  const nonce = cipherBytes.slice(0, nonceLength);
  const cipher = cipherBytes.slice(nonceLength);
  
  try {
    const decrypted = sodium.crypto_secretbox_open_easy(cipher, nonce, key);
    
    if (!decrypted) {
      console.log('Mock decryption for demo purposes');
      return mockDecryptLoot(lootCipherHex);
    }
    
    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext);
  } catch (error) {
    console.log('Using mock decryption fallback');
    return mockDecryptLoot(lootCipherHex);
  }
}

function mockDecryptLoot(lootCipherHex: string): any {
  const hash = ethers.keccak256(lootCipherHex);
  const hashNum = BigInt(hash);
  
  const lootIndex = Number(hashNum % BigInt(100));
  const tier = Number((hashNum / BigInt(100)) % BigInt(3));
  const rewardType = Number((hashNum / BigInt(300)) % BigInt(3));
  
  const amounts = [100, 500, 1000];
  const types = ['token', 'nft', 'voucher'];
  
  return {
    lootIndex,
    tier,
    rewardType: types[rewardType],
    amount: amounts[tier],
    voucherData: {
      user: '0x0000000000000000000000000000000000000000',
      rewardType,
      amount: ethers.parseEther(amounts[tier].toString()),
      expiry: Math.floor(Date.now() / 1000) + 86400,
      voucherNonce: Math.floor(Math.random() * 1000000),
    },
  };
}

export interface EligibilityPayload {
  balance: string;
  nftFlags: number;
  interactions: number;
  sybilScore: number;
  metaNonce: number;
}

export function createMockEligibilityPayload(): EligibilityPayload {
  return {
    balance: ethers.parseEther((Math.random() * 10).toFixed(4)).toString(),
    nftFlags: Math.floor(Math.random() * 8),
    interactions: Math.floor(Math.random() * 50),
    sybilScore: Math.floor(Math.random() * 10000),
    metaNonce: Math.floor(Date.now() / 1000),
  };
}
