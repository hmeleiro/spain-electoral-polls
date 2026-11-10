export type PartyConfig = {
  key: string;
  label: string;
  shortName: string;
  color: string;
  textColor?: string;
};

export const NEUTRAL_PARTY_COLOR = '#8f8b85';

export const FA_FV_PARTY_KEY = 'fa_fv';
export const FA_FV_COMPONENT_KEYS = ['fa', 'fv'] as const;

export const PARTY_CONFIG: Record<string, PartyConfig> = {
  psoe: { key: 'psoe', label: 'PSOE', shortName: 'PSOE', color: '#e30613' },
  pp: { key: 'pp', label: 'PP', shortName: 'PP', color: '#1d84ce' },
  vox: { key: 'vox', label: 'Vox', shortName: 'Vox', color: '#63be21', textColor: '#17230d' },
  sumar: { key: 'sumar', label: 'Sumar', shortName: 'Sumar', color: '#e51b7e' },
  fa_fv: {
    key: 'fa_fv',
    label: 'Frente Amplio–Front Valencià',
    shortName: 'FA–FV',
    color: '#F03C00'
  },
  fa: {
    key: 'fa',
    label: 'Frente Amplio',
    shortName: 'Frente Amplio',
    color: '#F03C00'
  },
  fv: {
    key: 'fv',
    label: 'Front Valencià',
    shortName: 'Front Valencià',
    color: '#F03C00'
  },
  frente_amplio: {
    key: 'frente_amplio',
    label: 'Frente Amplio',
    shortName: 'Frente Amplio',
    color: '#F03C00'
  },
  podemos: { key: 'podemos', label: 'Podemos', shortName: 'Podemos', color: '#9169F4' },
  salf: { key: 'salf', label: 'SALF', shortName: 'SALF', color: '#5d6470' }
};

export function normalizePartyKey(value: string | null | undefined): string {
  return `${value ?? ''}`.trim().toLowerCase();
}

export function harmonizedPartyKey(value: string | null | undefined): string {
  const key = normalizePartyKey(value);
  return (FA_FV_COMPONENT_KEYS as readonly string[]).includes(key) ? FA_FV_PARTY_KEY : key;
}

export function expandHarmonizedPartyKeys(values: string[]): string[] {
  const expanded = new Set<string>();
  for (const value of values) {
    const key = normalizePartyKey(value);
    if (key === FA_FV_PARTY_KEY || (FA_FV_COMPONENT_KEYS as readonly string[]).includes(key)) {
      expanded.add(FA_FV_PARTY_KEY);
      for (const componentKey of FA_FV_COMPONENT_KEYS) expanded.add(componentKey);
    } else {
      expanded.add(key);
    }
  }
  return [...expanded].filter(Boolean);
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
