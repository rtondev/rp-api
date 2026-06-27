const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const PROD_ORIGINS = [
  'https://rotapotiguar.com',
  'https://www.rotapotiguar.com',
  '*.vercel.app',
];

export function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (raw) {
    const fromEnv = raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (fromEnv.length > 0) return fromEnv;
  }

  if (process.env.NODE_ENV === 'production') {
    return PROD_ORIGINS;
  }

  return [...DEV_ORIGINS, ...PROD_ORIGINS];
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  return allowedOrigins.some((allowed) => {
    if (!allowed.startsWith('*.')) return false;
    const suffix = allowed.slice(1);
    return origin.endsWith(suffix);
  });
}
