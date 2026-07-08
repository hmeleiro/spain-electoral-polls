export function dateToString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1970, 0, 1));
    epoch.setUTCDate(epoch.getUTCDate() + value);
    return epoch.toISOString().slice(0, 10);
  }
  if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    const text = value.toString();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  }
  const text = `${value}`.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

export function primaryPollDate(row: {
  fieldworkEnd?: string | null;
  publicationDate?: string | null;
  date?: string | null;
}): string | null {
  return row.fieldworkEnd ?? row.publicationDate ?? row.date ?? null;
}
