/**
 * Приводит введённый номер к цифрам в международном формате.
 * «8 999 123-45-67» → «79991234567». Возвращает null, если номер не похож на телефон.
 * checkAccount в MAX поддерживает только номера России/Казахстана (7) и Беларуси (375).
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 12 && digits.startsWith('375')) return digits;
  return null;
}

export function formatPhone(digits: string): string {
  if (!digits) return '';
  const ru = digits.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (ru) return `+7 ${ru[1]} ${ru[2]}-${ru[3]}-${ru[4]}`;
  return `+${digits}`;
}
