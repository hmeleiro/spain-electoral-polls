export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return 'n/d';
  return `${value.toLocaleString('es-ES', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })}%`;
}

export function formatSignedPoints(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return 'n/d';
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  return `${sign}${Math.abs(rounded).toLocaleString('es-ES', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })} pp`;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return 'n/d';
  return value.toLocaleString('es-ES', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return 'n/d';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function cleanText(value: string | null | undefined, fallback = 'n/d'): string {
  const text = `${value ?? ''}`.trim();
  return text || fallback;
}
