
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Signs a message with a keypair
 * @param keypair - The keypair to sign with
 * @param message - The message to sign
 * @returns The signature as Uint8Array
 */
export function signMessage(keypair: Keypair, message: Uint8Array): Uint8Array {
  // Convert the keypair secret key to the format needed by nacl
  return nacl.sign.detached(message, keypair.secretKey);
}

/**
 * Verifies a signature
 * @param publicKey - The public key bytes
 * @param message - The message that was signed
 * @param signature - The signature to verify
 * @returns True if valid, false otherwise
 */
export function verifySignature(
  publicKey: Uint8Array, 
  message: Uint8Array, 
  signature: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/**
 * Encodes a Uint8Array as a base58 string
 * @param bytes - The bytes to encode
 * @returns The base58 encoded string
 */
export function encodeBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

/**
 * Decodes a base58 string to a Uint8Array
 * @param base58String - The base58 string to decode
 * @returns The decoded bytes
 */
export function decodeBase58(base58String: string): Uint8Array {
  return bs58.decode(base58String);
}
