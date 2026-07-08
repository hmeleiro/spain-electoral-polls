import type { ValidationCheck, ValidationReport } from '$lib/data/schema';

export function parseValidationReport(raw: unknown): ValidationReport {
  const row = raw as Record<string, unknown>;
  return {
    generatedAt: typeof row.generated_at === 'string' ? row.generated_at : '',
    status: typeof row.status === 'string' ? row.status : 'unknown',
    checks: parseChecks(row.checks)
  };
}

export function hasValidationIssues(report: ValidationReport | null | undefined): boolean {
  return Boolean(report && report.status !== 'passed');
}

function parseChecks(value: unknown): Record<string, ValidationCheck> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, raw]) => {
      const check = raw as Record<string, unknown>;
      return [
        key,
        {
          status: typeof check.status === 'string' ? check.status : 'unknown',
          severity: typeof check.severity === 'string' ? check.severity : 'warning',
          message: typeof check.message === 'string' ? check.message : ''
        }
      ];
    })
  );
}
