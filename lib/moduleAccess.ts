function parseEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const salonOnlyEmails = new Set([
  ...parseEmailList(process.env.NEXT_PUBLIC_SALON_ONLY_EMAILS),
  ...parseEmailList(process.env.NEXT_PUBLIC_PRETTY_SALON_ONLY_EMAILS),
]);

export function isSalonOnlyEmail(email: string | null | undefined) {
  if (!email) return false;
  return salonOnlyEmails.has(email.trim().toLowerCase());
}
