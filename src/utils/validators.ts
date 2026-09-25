// Shared client-side format validation + input sanitization for common
// Indian business identifiers (PAN, GSTIN, mobile number, pincode, email).
// Keeping this centralized means every form validates the same way.

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PINCODE_REGEX = /^[1-9]\d{5}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Sanitizers — restrict what a user can even type into the field ─────────

export function sanitizePan(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

export function sanitizeGstin(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
}

export function sanitizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 10);
}

export function sanitizePincode(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 6);
}

// ── Validators — return an error message, or "" when the value is valid ────

export function validatePan(value: string, required = false): string {
  const v = (value || "").trim();
  if (!v) return required ? "PAN is required" : "";
  if (!PAN_REGEX.test(v)) return "Enter a valid PAN (format: ABCDE1234F)";
  return "";
}

export function validateGstin(value: string, required = false): string {
  const v = (value || "").trim();
  if (!v) return required ? "GSTIN is required" : "";
  if (!GSTIN_REGEX.test(v)) return "Enter a valid 15-character GSTIN (format: 22ABCDE1234F1Z5)";
  return "";
}

export function validatePhone(value: string, required = false): string {
  const v = (value || "").trim();
  if (!v) return required ? "Mobile number is required" : "";
  if (!/^\d+$/.test(v)) return "Mobile number must contain digits only";
  if (v.length !== 10) return "Mobile number must be exactly 10 digits";
  if (!PHONE_REGEX.test(v)) return "Enter a valid 10-digit mobile number";
  return "";
}

export function validatePincode(value: string, required = false): string {
  const v = (value || "").trim();
  if (!v) return required ? "Pincode is required" : "";
  if (!/^\d+$/.test(v)) return "Pincode must contain digits only";
  if (v.length !== 6) return "Pincode must be exactly 6 digits";
  if (!PINCODE_REGEX.test(v)) return "Enter a valid pincode";
  return "";
}

export function validateEmail(value: string, required = false): string {
  const v = (value || "").trim();
  if (!v) return required ? "Email is required" : "";
  if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
  return "";
}
