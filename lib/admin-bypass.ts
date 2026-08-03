import { normalizeEmail } from "./usage-settings";

const defaultAdminBypassEmails = ["sato.motoki@t-rails.com"];

export function isAdminBypassEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const configuredEmails = (process.env.ADMIN_BYPASS_EMAILS || "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

  return new Set([...defaultAdminBypassEmails, ...configuredEmails]).has(normalized);
}
