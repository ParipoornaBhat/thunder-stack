export const THUNDER_VERSION = "1.0.0";
export const THUNDER_APP_NAME = "THUNDER Stack";

// Default domain restriction parameters if needed
export const DEFAULT_ALLOWED_DOMAINS = ["thunder.com", "gmail.com"];
export function isAllowedEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return DEFAULT_ALLOWED_DOMAINS.includes(domain);
}
