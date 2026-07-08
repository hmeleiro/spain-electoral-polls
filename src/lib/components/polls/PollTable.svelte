<script lang="ts">
  import type { PartyConfig } from '$lib/config/parties';
  import type { Poll, PollResult } from '$lib/data/schema';
  import { cleanText, formatNumber, formatPercent, formatShortDate } from '$lib/utils/format';

  export let polls: Array<Poll & { results?: PollResult[] }> = [];
  export let parties: PartyConfig[] = [];
  export let pageSize = 20;

  type SortKey = 'date' | 'pollster' | 'sample';
  let sortKey: SortKey = 'date';
  let sortDirection: 'asc' | 'desc' = 'desc';
  let currentPage = 1;

  $: sortedPolls = [...polls].sort((a, b) => comparePolls(a, b));
  $: pageCount = Math.max(1, Math.ceil(sortedPolls.length / pageSize));
  $: if (currentPage > pageCount) currentPage = pageCount;
  $: pageStart = (currentPage - 1) * pageSize;
  $: pagePolls = sortedPolls.slice(pageStart, pageStart + pageSize);

  function setSort(key: SortKey) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = key === 'date' ? 'desc' : 'asc';
    }
    currentPage = 1;
  }

  function comparePolls(a: Poll, b: Poll): number {
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (sortKey === 'pollster') return direction * a.pollsterName.localeCompare(b.pollsterName);
    if (sortKey === 'sample') return direction * ((a.sampleSize ?? -1) - (b.sampleSize ?? -1));
    return direction * ((a.date ?? '').localeCompare(b.date ?? ''));
  }

  function resultFor(results: PollResult[] | undefined, partyKey: string): PollResult | undefined {
    return results?.find((result) => result.partyKey === partyKey);
  }
</script>

<div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-secondary)]">
  <span>
    {sortedPolls.length} encuestas · pagina {currentPage} de {pageCount}
  </span>
  <div class="pagination">
    <button type="button" disabled={currentPage === 1} on:click={() => (currentPage = Math.max(1, currentPage - 1))}>
      Anterior
    </button>
    <button type="button" disabled={currentPage === pageCount} on:click={() => (currentPage = Math.min(pageCount, currentPage + 1))}>
      Siguiente
    </button>
  </div>
</div>

<div class="table-scroll">
  <table class="data-table">
    <thead>
      <tr>
        <th><button type="button" on:click={() => setSort('date')}>Fecha</button></th>
        <th><button type="button" on:click={() => setSort('pollster')}>Encuestadora</button></th>
        <th>Medio</th>
        <th><button type="button" on:click={() => setSort('sample')}>Muestra</button></th>
        {#each parties as party}
          <th>{party.shortName}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each pagePolls as poll}
        <tr>
          <td>
            <a class="font-semibold text-[var(--color-accent)]" href={`/encuestas/${poll.pollId}`}>
              {formatShortDate(poll.date)}
            </a>
          </td>
          <td>
            <a class="font-semibold text-[var(--color-text)] hover:text-[var(--color-accent)]" href={`/encuestadoras/${poll.pollsterKey}`}>
              {poll.pollsterName}
            </a>
          </td>
          <td>{cleanText(poll.media, 'Sin medio')}</td>
          <td>{formatNumber(poll.sampleSize)}{poll.sampleSizeImputed ? ' (imp.)' : ''}</td>
          {#each parties as party}
            {@const result = resultFor(poll.results, party.key)}
            <td class="font-semibold" style={result ? `color:${result.colorHex}` : ''}>
              {formatPercent(result?.voteShare, 1)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  th button {
    color: inherit;
    font-weight: inherit;
    text-transform: inherit;
  }

  .pagination {
    display: flex;
    gap: 0.4rem;
  }

  .pagination button {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-accent);
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.35rem 0.65rem;
  }

  .pagination button:disabled {
    color: var(--color-text-secondary);
    cursor: not-allowed;
    opacity: 0.45;
  }
</style>
