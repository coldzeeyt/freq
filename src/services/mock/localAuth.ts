import * as Crypto from 'expo-crypto';
import type { Account } from '@/types/models';
import { readJSON, writeJSON } from '../storage';
import type { AuthService } from '../types';

const KEY = 'account';

interface Stored {
  account: Account;
  salt: string;
  passwordHash: string;
  signedIn: boolean;
}

const hash = (salt: string, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

/**
 * Device-only accounts so the sign-up flow works without a backend. Only a
 * salted hash of the password is kept. Replace with Supabase Auth (or similar)
 * for real accounts that work across devices.
 */
export function createLocalAuth(): AuthService {
  return {
    async currentAccount() {
      const s = await readJSON<Stored | null>(KEY, null);
      return s?.signedIn ? s.account : null;
    },

    async createAccount({ name, handle, email, password }) {
      const salt = Crypto.randomUUID();
      const account: Account = {
        id: 'me',
        name: name.trim(),
        handle: handle.trim().replace(/^@/, '').toLowerCase(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      await writeJSON(KEY, { account, salt, passwordHash: await hash(salt, password), signedIn: true } satisfies Stored);
      return account;
    },

    async signIn(email, password) {
      const s = await readJSON<Stored | null>(KEY, null);
      if (!s || s.account.email !== email.trim().toLowerCase()) throw new Error('No account with that email on this device.');
      if ((await hash(s.salt, password)) !== s.passwordHash) throw new Error('That password doesn’t match.');
      await writeJSON(KEY, { ...s, signedIn: true });
      return s.account;
    },

    async signOut() {
      const s = await readJSON<Stored | null>(KEY, null);
      if (s) await writeJSON(KEY, { ...s, signedIn: false });
    },
  };
}
