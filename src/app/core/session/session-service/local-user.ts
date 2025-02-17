import * as CryptoJS from "crypto-js";

/**
 * User object as received from the remote server database.
 * See {@link https://docs.couchdb.org/en/stable/intro/security.html?highlight=_users#users-documents}
 */
export interface DatabaseUser {
  name: string;
  roles: string[];
}

/**
 * User object as prepared and used by the local session.
 */
export interface LocalUser extends DatabaseUser {
  encryptedPassword: EncryptedPassword;
}

export interface EncryptedPassword {
  hash: string;
  salt: string;
  iterations: number;
  keySize: number;
}

export function encryptPassword(
  password: string,
  iterations = 128,
  keySize = 256 / 32,
  salt = CryptoJS.lib.WordArray.random(128 / 8).toString()
): EncryptedPassword {
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize,
    iterations: iterations,
  }).toString();
  return {
    hash: hash,
    iterations: iterations,
    keySize: keySize,
    salt: salt,
  };
}

export function passwordEqualsEncrypted(
  password: string,
  encryptedPassword: EncryptedPassword
): boolean {
  const hash = CryptoJS.PBKDF2(password, encryptedPassword?.salt, {
    iterations: encryptedPassword?.iterations,
    keySize: encryptedPassword?.keySize,
  }).toString();
  return hash === encryptedPassword.hash;
}
