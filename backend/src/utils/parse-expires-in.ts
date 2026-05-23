export function parseExpiresIn(expiresIn: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(
      `Invalid expiration format: "${expiresIn}". Expected format: <number><unit> where unit is s, m, h, or d.`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
}