declare module 'hkdf' {
  export function hkdf(
    hash: string,
    ikm: Buffer | Uint8Array,
    salt: Buffer | Uint8Array | null,
    info: string | Buffer | Uint8Array,
    length: number
  ): Uint8Array;
}
