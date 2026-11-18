export { failureMessageKey } from './auth-messages';
export { AuthProvider } from './AuthProvider';
export { createSupabaseAuthService } from './api/supabase-auth-service';
export type {
  AuthChangeEvent,
  AuthChangeListener,
  AuthFailureReason,
  AuthResult,
  AuthService,
  AuthStatus,
  AuthUser,
  SignedOutReason,
} from './auth-types';
export {
  CODE_LENGTH,
  checkEmail,
  checkNewPassword,
  isCompleteCode,
  normalizeCode,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './credentials';
export type { EmailError, NewPasswordError } from './credentials';
export { loginPathFor, readNextPath, safeNextPath } from './next-path';
export { clearPendingSignup, readPendingSignup, rememberPendingSignup } from './pending-signup';
export type { PendingSignup } from './pending-signup';
export {
  checkDisplayName,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  TERMS_VERSION,
} from './signup';
export type { DisplayNameError, SignupInput, SignupProfile } from './signup';
export { DEFAULT_TRAINING_SETTINGS, SAME_BUTTON_MODES, parseProfile } from './profile';
export type { ProfilePatch, SameButtonMode, UserProfile } from './profile';
export { ProfileLanguageSync } from './ProfileLanguageSync';
export { RequireAuth } from './RequireAuth';
export { RequireGuest } from './RequireGuest';
export { useAuth } from './useAuth';
export { useAuthAction } from './useAuthAction';
export { useNeedsCurrentPassword, useProfile, useUpdateProfile } from './useProfile';
export { RESEND_WAIT_SECONDS, useResendTimer } from './useResendTimer';
export { useSignIn } from './useSignIn';
