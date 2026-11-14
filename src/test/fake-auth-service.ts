import type {
  AuthChangeEvent,
  AuthChangeListener,
  AuthResult,
  AuthService,
  AuthUser,
} from '@/core/auth';

// Un AuthService en memoria para los tests: sin Supabase ni red. Imita lo que
// hace el real (mismos motivos de fallo, mismos avisos de cambio). El código que
// "llega por email" es siempre FAKE_CODE.

export interface FakeAccount {
  email: string;
  password: string;
  confirmed?: boolean;
}

export const FAKE_PASSWORD = 'password123';
export const FAKE_CODE = '123456';

// Sus espacios están en `fake-tenancy-source.ts`. `nobody-yet@` no tiene ninguno.
export const FAKE_ACCOUNTS: readonly FakeAccount[] = [
  { email: 'coach@example.test', password: FAKE_PASSWORD },
  { email: 'client@example.test', password: FAKE_PASSWORD },
  { email: 'norte-client@example.test', password: FAKE_PASSWORD },
  { email: 'dual@example.test', password: FAKE_PASSWORD },
  { email: 'archived@example.test', password: FAKE_PASSWORD },
  { email: 'nobody-yet@example.test', password: FAKE_PASSWORD },
  { email: 'pending@example.test', password: FAKE_PASSWORD, confirmed: false },
];

export type FakeCodeKind = 'sign-in' | 'reset';

interface FakeAuthOptions {
  accounts?: readonly FakeAccount[];
  /** Email de la cuenta con la sesión ya abierta al arrancar, o `null`. */
  signedInAs?: string | null;
}

export interface FakeAuthService extends AuthService {
  /** Simula que la sesión se pierde sin que el usuario la cierre. */
  expireSession(): void;
  readonly currentUser: AuthUser | null;
  /** Los códigos "enviados por email", en orden. */
  readonly sentCodes: readonly { email: string; kind: FakeCodeKind }[];
  /** Cuántas veces se cerraron las sesiones de los demás dispositivos. */
  readonly otherSessionsClosed: number;
  passwordOf(email: string): string | undefined;
}

const OK: AuthResult = { ok: true };

function fail(reason: Exclude<AuthResult, { ok: true }>['reason']): Promise<AuthResult> {
  return Promise.resolve({ ok: false, reason });
}

function userFor(email: string): AuthUser {
  return { id: `user-${email}`, email };
}

export function createFakeAuthService({
  accounts = FAKE_ACCOUNTS,
  signedInAs = 'coach@example.test',
}: FakeAuthOptions = {}): FakeAuthService {
  const store = new Map(accounts.map((account) => [account.email, { ...account }]));
  let current: AuthUser | null = signedInAs === null ? null : userFor(signedInAs);
  const listeners = new Set<AuthChangeListener>();
  const sentCodes: { email: string; kind: FakeCodeKind }[] = [];
  let otherSessionsClosed = 0;

  const notify = (event: AuthChangeEvent) => {
    for (const listener of listeners) {
      listener(current, event);
    }
  };
  const find = (email: string) => store.get(email.trim().toLowerCase());
  const signInAs = (email: string) => {
    current = userFor(email);
    notify('signed-in');
  };
  const sendCode = (email: string, kind: FakeCodeKind): Promise<AuthResult> => {
    if (find(email) === undefined) {
      return fail('no_account');
    }
    sentCodes.push({ email, kind });
    return Promise.resolve(OK);
  };
  const verifyCode = (email: string, code: string, kind: FakeCodeKind): Promise<AuthResult> => {
    const wasSent = sentCodes.some((sent) => sent.email === email && sent.kind === kind);
    const account = find(email);
    if (!wasSent || account === undefined || code !== FAKE_CODE) {
      return fail('invalid_code');
    }
    signInAs(account.email);
    return Promise.resolve(OK);
  };

  return {
    get currentUser() {
      return current;
    },
    get sentCodes() {
      return sentCodes;
    },
    get otherSessionsClosed() {
      return otherSessionsClosed;
    },
    passwordOf(email) {
      return find(email)?.password;
    },

    onChange(listener) {
      listeners.add(listener);
      // Como Supabase: el primer aviso llega enseguida, pero no en el mismo instante.
      queueMicrotask(() => listener(current, 'initial'));
      return () => listeners.delete(listener);
    },

    signInWithPassword(email, password) {
      const account = find(email);
      if (account === undefined) {
        return fail('no_account');
      }
      if (account.password !== password) {
        return fail('wrong_password');
      }
      if (account.confirmed === false) {
        return fail('email_not_confirmed');
      }
      signInAs(account.email);
      return Promise.resolve(OK);
    },

    sendSignInCode: (email) => sendCode(email, 'sign-in'),
    verifySignInCode: (email, code) => verifyCode(email, code, 'sign-in'),
    sendPasswordResetCode: (email) => sendCode(email, 'reset'),
    verifyPasswordResetCode: (email, code) => verifyCode(email, code, 'reset'),

    updatePassword(newPassword, currentPassword) {
      const account = current === null ? undefined : find(current.email);
      if (account === undefined) {
        return fail('unknown');
      }
      if (currentPassword !== undefined && currentPassword !== account.password) {
        return fail('wrong_password');
      }
      if (newPassword.length < 8) {
        return fail('weak_password');
      }
      if (newPassword === account.password) {
        return fail('same_password');
      }
      account.password = newPassword;
      otherSessionsClosed += 1;
      return Promise.resolve(OK);
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
