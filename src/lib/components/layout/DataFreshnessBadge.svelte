<script lang="ts">
  import type { Manifest } from '$lib/data/schema';
  import { formatDate, formatDateTime } from '$lib/utils/format';

  export let manifest: Manifest | null = null;
</script>

{#if manifest}
  <div class="freshness" aria-label="Metadatos del dataset">
    <span>Trabajo de campo: {formatDate(manifest.latestFieldworkEnd)}</span>
    <span>Generado: {formatDateTime(manifest.generatedAt)}</span>
    <span>v{manifest.projectVersion}</span>
    <span class:passed={manifest.validationStatus === 'passed'}>
      Validacion: {manifest.validationStatus || 'n/d'}
    </span>
  </div>
{/if}

<style>
  .freshness {
    color: var(--color-text-secondary);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.75rem;
    gap: 0.45rem 0.75rem;
  }

  .freshness span {
    border-right: 1px solid var(--color-border);
    padding-right: 0.75rem;
  }

  .freshness span:last-child {
    border-right: 0;
    padding-right: 0;
  }

  .passed {
    color: #15803d;
    font-weight: 700;
  }
</style>
