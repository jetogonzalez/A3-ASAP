export function cleanText(input: string, max: number): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function safeFilename(input: string): string {
  const base = input.split(/[/\\]/).pop() ?? "arte";
  const cleaned = base
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^\p{L}\p{N} ._()-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || "arte";
}

export type DocumentType = "cedula" | "ruc" | "pasaporte";

export const DOCUMENT_TYPES: Array<{ id: DocumentType; label: string; placeholder: string }> = [
  { id: "cedula", label: "Cédula", placeholder: "1712345678" },
  { id: "ruc", label: "RUC", placeholder: "1712345678001" },
  { id: "pasaporte", label: "Pasaporte", placeholder: "AB123456" },
];

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.some((type) => type.id === value);
}

/*
 * Cédula ecuatoriana: dos dígitos de provincia, un tercero menor a 6 para
 * personas naturales y un dígito verificador al final, con el algoritmo del
 * módulo 10 que usa el Registro Civil.
 */
export function cedulaOk(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{10}$/.test(digits)) return false;
  const province = Number(digits.slice(0, 2));
  if (province < 1 || (province > 24 && province !== 30)) return false;
  if (Number(digits[2]) > 5) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    const digit = Number(digits[index]);
    const doubled = index % 2 === 0 ? digit * 2 : digit;
    sum += doubled > 9 ? doubled - 9 : doubled;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[9]);
}

/*
 * RUC: los 13 dígitos terminan en el código del establecimiento, que nunca es
 * 000. Para personas naturales los primeros diez son una cédula válida; para
 * sociedades y entidades públicas el verificador va en otra posición y no lo
 * comprobamos, solo la forma.
 */
export function rucOk(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{13}$/.test(digits)) return false;
  if (digits.slice(10) === "000") return false;
  const province = Number(digits.slice(0, 2));
  if (province < 1 || (province > 24 && province !== 30)) return false;
  const third = Number(digits[2]);
  if (third < 6) return cedulaOk(digits.slice(0, 10));
  return third === 6 || third === 9;
}

export function documentOk(type: DocumentType, value: string): boolean {
  if (type === "cedula") return cedulaOk(value);
  if (type === "ruc") return rucOk(value);
  return /^[A-Za-z0-9]{5,20}$/.test(value.replace(/\s/g, ""));
}

export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[^\d+]/g, "");
  if (!/^(?:\+593|593|0)\d{8,9}$/.test(compact)) return null;
  if (compact.startsWith("+593")) return compact;
  if (compact.startsWith("593")) return `+${compact}`;
  return `+593${compact.slice(1)}`;
}
