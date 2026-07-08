<script lang="ts">
  import type { ValidationReport } from '$lib/data/schema';

  export let report: ValidationReport | null = null;

  $: issues = report
    ? Object.entries(report.checks).filter(([, check]) => check.status !== 'pass')
    : [];
</script>

{#if report && report.status !== 'passed'}
  <div class="panel border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-4">
    <p class="text-sm font-bold text-[var(--color-warning)]">El informe de validacion no esta en estado passed.</p>
    <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
      Estado: {report.status}. La app sigue disponible porque los datos esenciales han cargado.
    </p>
    {#if issues.length}
      <ul class="mt-3 grid gap-1 text-sm text-[var(--color-text-secondary)]">
        {#each issues.slice(0, 4) as [key, check]}
          <li><strong>{key}:</strong> {check.message}</li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
