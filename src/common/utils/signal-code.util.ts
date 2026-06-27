import type { PrismaClient } from '@prisma/client';

const CODE_PATTERN = /^\d{6}$/;

export function normalizeSignalCode(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 6) {
    return digits.padStart(6, '0').slice(-6);
  }
  return digits;
}

export function isValidSignalCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

export async function generateUniqueSignalCode(
  prisma: PrismaClient,
): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    const place = await prisma.place.findUnique({
      where: { signalCode: code },
      select: { id: true },
    });
    if (!place) return code;
  }
  throw new Error('Não foi possível gerar um código único');
}

export async function ensurePlaceSignalCode(
  prisma: PrismaClient,
  placeId: string,
): Promise<string> {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { signalCode: true },
  });
  if (!place) throw new Error('Local não encontrado');
  if (place.signalCode) return place.signalCode;

  const signalCode = await generateUniqueSignalCode(prisma);
  await prisma.place.update({
    where: { id: placeId },
    data: { signalCode },
  });
  return signalCode;
}

export async function backfillMissingSignalCodes(
  prisma: PrismaClient,
): Promise<void> {
  const places = await prisma.place.findMany({
    where: { signalCode: null },
    select: { id: true },
  });
  for (const place of places) {
    await ensurePlaceSignalCode(prisma, place.id);
  }
}
