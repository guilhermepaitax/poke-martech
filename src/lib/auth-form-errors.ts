import { isPasswordValid } from "@/lib/password-policy";

const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = "sign-in" | "sign-up";

type AuthFieldInput = {
  email: string;
  password: string;
  name: string;
  username: string;
  imageUseConsent: boolean;
};

type AuthFieldErrors = Partial<Record<keyof AuthFieldInput, string>>;

type AuthApiError = {
  code?: string;
  message?: string;
};

const CODE_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Informe um e-mail válido.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_PASSWORD: "A senha não atende aos requisitos.",
  PASSWORD_TOO_SHORT: "A senha não atende aos requisitos.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail.",
  USERNAME_ALREADY_EXISTS: "Esse usuário já está em uso.",
  INVALID_USERNAME:
    "Use letras minúsculas, números e hífens. Exemplo: ana-silva",
  INVALID_NAME: "Informe seu nome.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  BANNED_USER:
    "Esta conta está suspensa. Fale com o suporte se achar que isso é um engano.",
  FAILED_TO_CREATE_SESSION: "Não foi possível iniciar a sessão. Tente de novo.",
  FAILED_TO_CREATE_USER: "Não foi possível criar a conta. Tente de novo.",
  EMAIL_PASSWORD_DISABLED: "O login com e-mail e senha não está disponível.",
  EMAIL_PASSWORD_SIGN_UP_DISABLED:
    "O cadastro com e-mail e senha não está disponível.",
  IMAGE_USE_CONSENT_REQUIRED: "Aceite o uso da sua imagem para criar a conta.",
};

const ENGLISH_MESSAGES: Record<string, string> = {
  "Invalid email": CODE_MESSAGES.INVALID_EMAIL,
  "Invalid email address": CODE_MESSAGES.INVALID_EMAIL,
  "Invalid email or password": CODE_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
  "Invalid password": CODE_MESSAGES.INVALID_PASSWORD,
  "Password too short": CODE_MESSAGES.PASSWORD_TOO_SHORT,
  "Password too long": CODE_MESSAGES.PASSWORD_TOO_LONG,
  "User already exists.": CODE_MESSAGES.USER_ALREADY_EXISTS,
  "User already exists. Use another email.":
    CODE_MESSAGES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL,
  "Email not verified": CODE_MESSAGES.EMAIL_NOT_VERIFIED,
  "Failed to create user": CODE_MESSAGES.FAILED_TO_CREATE_USER,
  "Failed to create session": CODE_MESSAGES.FAILED_TO_CREATE_SESSION,
  "Email and password is not enabled": CODE_MESSAGES.EMAIL_PASSWORD_DISABLED,
  "Email and password sign up is not enabled":
    CODE_MESSAGES.EMAIL_PASSWORD_SIGN_UP_DISABLED,
  "You have been banned from this application": CODE_MESSAGES.BANNED_USER,
  "You have been banned from this application. Please contact support if you believe this is an error.":
    CODE_MESSAGES.BANNED_USER,
  "Failed to fetch":
    "Não foi possível conectar. Verifique sua internet e tente de novo.",
  "Load failed":
    "Não foi possível conectar. Verifique sua internet e tente de novo.",
  "Network Error":
    "Não foi possível conectar. Verifique sua internet e tente de novo.",
};

const ENGLISH_HINT =
  /\b(user|users|password|email|invalid|failed|failure|already|exists|session|banned|required|verification|token|fetch|network)\b/i;

function fallbackMessage(mode: AuthMode) {
  return mode === "sign-in"
    ? "Não foi possível entrar."
    : "Não foi possível cadastrar.";
}

function authFieldErrors(
  mode: AuthMode,
  input: AuthFieldInput,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = input.email.trim();

  if (mode === "sign-up") {
    if (input.name.trim().length === 0) errors.name = "Informe seu nome.";
    const username = input.username.trim().toLowerCase();
    if (!username) errors.username = "Informe um usuário.";
    else if (!USERNAME_PATTERN.test(username)) {
      errors.username =
        "Use letras minúsculas, números e hífens. Exemplo: ana-silva";
    }
    if (!isPasswordValid(input.password)) {
      errors.password = "A senha não atende aos requisitos.";
    }
    if (!input.imageUseConsent) {
      errors.imageUseConsent = "Aceite o uso da sua imagem para criar a conta.";
    }
  } else if (input.password.length === 0) {
    errors.password = "Informe sua senha.";
  }

  if (!email) errors.email = "Informe seu e-mail.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Informe um e-mail válido.";

  return errors;
}

function authApiErrorMessage(mode: AuthMode, error: AuthApiError) {
  if (error.code === "WEAK_PASSWORD" && error.message) return error.message;
  if (error.code && CODE_MESSAGES[error.code]) return CODE_MESSAGES[error.code];
  if (error.message && ENGLISH_MESSAGES[error.message])
    return ENGLISH_MESSAGES[error.message];
  if (!error.message || ENGLISH_HINT.test(error.message))
    return fallbackMessage(mode);
  return error.message;
}

export {
  authApiErrorMessage,
  authFieldErrors,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
};
export type { AuthApiError, AuthFieldErrors, AuthFieldInput, AuthMode };
