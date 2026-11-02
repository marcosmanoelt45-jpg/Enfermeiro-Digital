/**
 * Política de senha do Enfere, espelhando o Supabase Auth
 * (Authentication → Providers → Email): mínimo 8 caracteres com
 * minúscula, maiúscula, número e símbolo.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = [
  { id: "length", label: `${PASSWORD_MIN_LENGTH} caracteres ou mais`, test: (s) => s.length >= PASSWORD_MIN_LENGTH },
  { id: "lower", label: "Uma letra minúscula", test: (s) => /[a-z]/.test(s) },
  { id: "upper", label: "Uma letra maiúscula", test: (s) => /[A-Z]/.test(s) },
  { id: "digit", label: "Um número", test: (s) => /\d/.test(s) },
  { id: "symbol", label: "Um símbolo (!@#$…)", test: (s) => /[^A-Za-z0-9]/.test(s) },
];

export function checkPassword(password = "") {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) }));
  return { results, isValid: results.every((r) => r.ok) };
}

export function passwordPolicyError(password = "") {
  const missing = checkPassword(password).results.filter((r) => !r.ok);
  if (!missing.length) return null;
  return `A senha precisa de: ${missing.map((r) => r.label.toLowerCase()).join(", ")}.`;
}
