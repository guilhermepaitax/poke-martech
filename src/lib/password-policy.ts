const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_RULES = [
  {
    id: "length",
    label: "Pelo menos 8 caracteres",
    test: (password: string) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "digit",
    label: "Um número",
    test: (password: string) => /\d/.test(password),
  },
] as const;

type PasswordCheck = {
  id: (typeof PASSWORD_RULES)[number]["id"];
  label: string;
  met: boolean;
};

function evaluatePassword(password: string): PasswordCheck[] {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
}

function isPasswordValid(password: string) {
  return evaluatePassword(password).every((rule) => rule.met);
}

function unmetPasswordMessage(password: string) {
  const missing = evaluatePassword(password).filter((rule) => !rule.met);
  if (missing.length === 0) return null;
  const list = missing.map(
    (rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1),
  );
  return `A senha ainda precisa de ${list.join(", ")}.`;
}

export {
  MIN_PASSWORD_LENGTH,
  evaluatePassword,
  isPasswordValid,
  unmetPasswordMessage,
};
export type { PasswordCheck };
