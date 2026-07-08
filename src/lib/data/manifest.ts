import type { Manifest } from '$lib/data/schema';

export function parseManifest(raw: unknown): Manifest {
  const row = raw as Record<string, unknown>;
  return {
    schemaVersion: stringValue(row.schema_version),
    projectVersion: stringValue(row.project_version),
    generatedAt: stringValue(row.generated_at),
    runId: stringValue(row.run_id),
    source: stringValue(row.source),
    averageElectionKey: stringValue(row.average_election_key),
    houseEffectElectionKeys: arrayOfStrings(row.house_effect_election_keys),
    parties: arrayOfStrings(row.parties),
    latestFieldworkEnd: stringValue(row.latest_fieldwork_end),
    rowCounts: recordOfNumbers(row.row_counts),
    validationStatus: stringValue(row.validation_status)
  };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function recordOfNumbers(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  );
}
