<script lang="ts">
  import type { PollsterSummary } from '$lib/data/schema';
  import { formatShortDate } from '$lib/utils/format';

  export let pollster: PollsterSummary;
</script>

<a href={`/encuestadoras/${pollster.pollsterKey}`} class="panel card block p-4 no-underline">
  <div class="flex items-start justify-between gap-3">
    <div>
      <h3 class="text-base font-bold text-[var(--color-text)]">{pollster.pollsterName}</h3>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
        {pollster.nPolls} encuestas · ultima {formatShortDate(pollster.lastPollDate)}
      </p>
    </div>
    <span class="text-xs font-bold text-[var(--color-accent)]">Ver</span>
  </div>
  <p class="mt-3 text-xs text-[var(--color-text-secondary)]">
    {pollster.media.slice(0, 4).join(', ') || 'Sin medios asociados'}
  </p>
</a>

<style>
  .card {
    transition: border-color var(--transition), transform var(--transition);
  }

  .card:hover {
    border-color: var(--color-accent);
    transform: translateY(-1px);
  }
</style>
