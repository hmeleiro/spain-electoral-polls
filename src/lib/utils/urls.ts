export function externalUrl(value: string | null | undefined): string | null {
  const text = `${value ?? ''}`.trim();
  if (!text) return null;
  try {
    return new URL(text).toString();
  } catch {
    return null;
  }
}
