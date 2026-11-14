import type {
  AuthChangeEvent,
  AuthChangeListener,
  AuthResult,
  AuthService,
  AuthUser,
  SignupProfile,
  UserProfile,
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
  { email: 'norte-coach@example.test', password: FAKE_PASSWORD },
  { email: 'nobody-yet@example.test', password: FAKE_PASSWORD },
  { email: 'pending@example.test', password: FAKE_PASSWORD, confirmed: false },
];

export type FakeCodeKind = 'sign-in' | 'reset' | 'signup';

interface FakeAuthOptions {
  accounts?: readonly FakeAccount[];
  /** Email de la cuenta con la sesión ya abierta al arrancar, o `null`. */
  signedInAs?: string | null;
  /** Cómo entró la sesión abierta al arrancar: con contraseña o con un código. */
  signedInWith?: 'password' | 'code';
  /** Perfiles de partida, por email. Sin perfil: el nombre del email, inglés y kg. */
  profiles?: Readonly<Record<string, Partial<UserProfile>>>;
}

export interface FakeAuthService extends AuthService {
  profileOf(email: string): UserProfile;
  /** Simula que la sesión se pierde sin que el usuario la cierre. */
  expireSession(): void;
  readonly currentUser: AuthUser | null;
  /** Los códigos "enviados por email", en orden. */
  readonly sentCodes: readonly { email: string; kind: FakeCodeKind }[];
  /** Cuántas veces se cerraron las sesiones de los demás dispositivos. */
  readonly otherSessionsClosed: number;
  passwordOf(email: string): string | undefined;
  /** Los datos guardados al completar el registro, por email. */
  readonly completedProfiles: ReadonlyMap<string, SignupProfile>;
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
  signedInWith = 'password',
  profiles: initialProfiles = {},
}: FakeAuthOptions = {}): FakeAuthService {
  const store = new Map(accounts.map((account) => [account.email, { ...account }]));
  let current: AuthUser | null = signedInAs === null ? null : userFor(signedInAs);
  let signInMethod: 'password' | 'code' = signedInWith;
  const listeners = new Set<AuthChangeListener>();
  const sentCodes: { email: string; kind: FakeCodeKind }[] = [];
  const completedProfiles = new Map<string, SignupProfile>();
  const profiles = new Map<string, UserProfile>();
  let otherSessionsClosed = 0;

  const profileOf = (email: string): UserProfile => {
    const stored = profiles.get(email);
    if (stored !== undefined) {
      return stored;
    }
    return {
      displayName: email.split('@')[0] ?? email,
      locale: 'en',
      weightUnit: 'kg',
      ...initialProfiles[email],
    };
  };

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
    // Confirmar el código confirma también el email, como en Supabase.
    account.confirmed = true;
    signInMethod = 'code';
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
    get completedProfiles() {
      return completedProfiles;
    },
    profileOf,

    getProfile() {
      if (current === null) {
        return Promise.reject(new Error('not signed in'));
      }
      return Promise.resolve(profileOf(current.email));
    },

    updateProfile(patch) {
      if (current === null) {
        return fail('unknown');
      }
      profiles.set(current.email, { ...profileOf(current.email), ...patch });
      return Promise.resolve(OK);
    },

    needsCurrentPassword() {
      return Promise.resolve(signInMethod === 'password');
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
      signInMethod = 'password';
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

    signUp(input) {
      const existing = find(input.email);
      if (existing !== undefined) {
        // Como Supabase con confirmación: no se toca la cuenta que ya existe.
        return fail(existing.confirmed === false ? 'email_not_confirmed' : 'account_exists');
      }
      store.set(input.email, { email: input.email, password: input.password, confirmed: false });
      sentCodes.push({ email: input.email, kind: 'signup' });
      return Promise.resolve(OK);
    },

    resendSignupCode(email) {
      const account = find(email);
      if (account === undefined) {
        return fail('no_account');
      }
      if (account.confirmed !== false) {
        return fail('account_exists');
      }
      sentCodes.push({ email: account.email, kind: 'signup' });
      return Promise.resolve(OK);
    },

    verifySignupCode: (email, code) => verifyCode(email, code, 'signup'),

    completeSignup({ password, profile }) {
      const account = current === null ? undefined : find(current.email);
      if (account === undefined) {
        return fail('unknown');
      }
      if (password !== null) {
        account.password = password;
      }
      if (profile !== null) {
        completedProfiles.set(account.email, profile);
      }
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
