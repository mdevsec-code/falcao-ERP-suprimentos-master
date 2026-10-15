/** Só os dígitos (`12.345.678/0001-95` → `12345678000195`). */
export function cnpjDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara `00.000.000/0000-00`; devolve o texto original se não tiver 14 dígitos. */
export function formatCnpjMask(value: string): string {
  const digits = cnpjDigits(value);
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Confere os dois dígitos verificadores. O link aberto de cotação e o de
 * catálogo identificam o fornecedor pelo CNPJ — número inventado não passa.
 */
export function isValidCnpj(value: string): boolean {
  const digits = cnpjDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const check = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, index) => acc + Number(digits[index]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
}
