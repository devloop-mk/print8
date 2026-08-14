function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

/**
 * Read a required secret. In production, missing values throw at call time.
 * In development, a deterministic dev placeholder avoids blocking local work.
 */
export function getRequiredSecret(
  primaryEnv: string,
  alternateEnvs: string[] = [],
): string {
  for (const key of [primaryEnv, ...alternateEnvs]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  if (!isProductionRuntime()) {
    return `dev-insecure-${primaryEnv.toLowerCase()}`;
  }

  throw new Error(
    `Missing required secret environment variable: ${primaryEnv}`,
  );
}
