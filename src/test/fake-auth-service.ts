import type {
  AuthChangeEvent,
  AuthChangeListener,
  AuthResult,
  AuthService,
  AuthUser,
} from '@/core/auth';

// Un AuthService en memoria para los tests: sin Supabase ni red. Imita lo que
// hace el real (mismos motivos de fallo, mismos avisos de cambio).

export interface FakeAccount {
  email: string;
  password: string;
  confirmed?: boolean;
}

export const FAKE_PASSWORD = 'password123';

export const FAKE_ACCOUNTS: readonly FakeAccount[] = [
  { email: 'coach@example.test', password: FAKE_PASSWORD },
  { email: 'client@example.test', password: FAKE_PASSWORD },
  { email: 'pending@example.test', password: FAKE_PASSWORD, confirmed: false },
];

interface FakeAuthOptions {
  accounts?: readonly FakeAccount[];
  /** Email de la cuenta con la sesión ya abierta al arrancar, o `null`. */
  signedInAs?: string | null;
}

export interface FakeAuthService extends AuthService {
  /** Simula que la sesión se pierde sin que el usuario la cierre. */
  expireSession(): void;
  readonly currentUser: AuthUser | null;
}

function userFor(email: string): AuthUser {
  return { id: `user-${email}`, email };
}

export function createFakeAuthService({
  accounts = FAKE_ACCOUNTS,
  signedInAs = 'coach@example.test',
}: FakeAuthOptions = {}): FakeAuthService {
  let current: AuthUser | null = signedInAs === null ? null : userFor(signedInAs);
  const listeners = new Set<AuthChangeListener>();

  const notify = (event: AuthChangeEvent) => {
    for (const listener of listeners) {
      listener(current, event);
    }
  };

  return {
    get currentUser() {
      return current;
    },

    onChange(listener) {
      listeners.add(listener);
      // Como Supabase: el primer aviso llega enseguida, pero no en el mismo instante.
      queueMicrotask(() => listener(current, 'initial'));
      return () => listeners.delete(listener);
    },

    signInWithPassword(email, password): Promise<AuthResult> {
      const account = accounts.find((candidate) => candidate.email === email.trim().toLowerCase());
      if (account === undefined) {
        return Promise.resolve({ ok: false, reason: 'no_account' });
      }
      if (account.password !== password) {
        return Promise.resolve({ ok: false, reason: 'wrong_password' });
      }
      if (account.confirmed === false) {
        return Promise.resolve({ ok: false, reason: 'email_not_confirmed' });
      }
      current = userFor(account.email);
      notify('signed-in');
      return Promise.resolve({ ok: true });
    },

    signOut() {
      current = null;
      notify('signed-out');
      return Promise.resolve();
    },

    expireSession() {
      current = null;
      notify('signed-out');
    },
  };
}
