export type PartyConfig = {
  key: string;
  label: string;
  shortName: string;
  color: string;
  textColor?: string;
};

export const NEUTRAL_PARTY_COLOR = '#8f8b85';

export const PARTY_CONFIG: Record<string, PartyConfig> = {
  psoe: { key: 'psoe', label: 'PSOE', shortName: 'PSOE', color: '#e30613' },
  pp: { key: 'pp', label: 'PP', shortName: 'PP', color: '#1d84ce' },
  vox: { key: 'vox', label: 'Vox', shortName: 'Vox', color: '#63be21', textColor: '#17230d' },
  sumar: { key: 'sumar', label: 'Sumar', shortName: 'Sumar', color: '#e51b7e' },
  podemos: { key: 'podemos', label: 'Podemos', shortName: 'Podemos', color: '#9169F4' },
  salf: { key: 'salf', label: 'SALF', shortName: 'SALF', color: '#5d6470' }
};

export function normalizePartyKey(value: string | null | undefined): string {
  return `${value ?? ''}`.trim().toLowerCase();
}

export function getPartyConfig(
  partyKey: string | null | undefined,
  fallback?: Partial<PartyConfig>
): PartyConfig {
  const key = normalizePartyKey(partyKey);
  const configured = PARTY_CONFIG[key];
  const label = fallback?.label ?? configured?.label ?? fallback?.shortName ?? key;
  const shortName = fallback?.shortName ?? configured?.shortName ?? fallback?.label ?? key;
  return {
    key: configured?.key ?? key,
    label: label || 'n/d',
    shortName: shortName || 'n/d',
    color: fallback?.color ?? configured?.color ?? NEUTRAL_PARTY_COLOR,
    textColor: fallback?.textColor ?? configured?.textColor
  };
}
