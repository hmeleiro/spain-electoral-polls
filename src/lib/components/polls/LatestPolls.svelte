<script lang="ts">
  import type { Poll, PollResult } from '$lib/data/schema';
  import { cleanText, formatNumber, formatPercent, formatShortDate } from '$lib/utils/format';

  export let polls: Array<Poll & { results: PollResult[] }> = [];
</script>

<div class="grid gap-3">
  {#each polls as poll}
    <a href={`/encuestas/${poll.pollId}`} class="latest-row panel p-4 no-underline">
      <div>
        <p class="text-sm font-bold text-[var(--color-text)]">{poll.pollsterName}</p>
        <p class="text-xs text-[var(--color-text-secondary)]">
          {formatShortDate(poll.date)} · {cleanText(poll.media, 'Sin medio')} · muestra {formatNumber(poll.sampleSize)}
        </p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs font-bold">
        {#each poll.results.slice(0, 4) as result}
          <span style={`color:${result.colorHex}`}>{result.shortName} {formatPercent(result.voteShare, 1)}</span>
        {/each}
      </div>
    </a>
  {/each}
</div>

<style>
  .latest-row {
    display: grid;
    gap: 0.75rem;
    transition: border-color var(--transition), transform var(--transition);
  }

  .latest-row:hover {
    border-color: var(--color-accent);
    transform: translateY(-1px);
  }
</style>
