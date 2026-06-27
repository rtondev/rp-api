import { BadRequestException } from '@nestjs/common';

export const MAX_PROXIMITY_METERS = 100;

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length === 13 && digits.startsWith('55')) {
    return digits;
  }

  throw new BadRequestException('Informe um celular válido com DDD');
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;

  if (local.length !== 11) return phone;

  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}

export function isValidPhoneInput(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length === 11 || (digits.length === 13 && digits.startsWith('55'));
}
