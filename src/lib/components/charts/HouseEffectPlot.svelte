<script lang="ts">
  import type { HouseEffect } from '$lib/data/schema';
  import { formatNumber, formatSignedPoints } from '$lib/utils/format';

  export let effects: HouseEffect[] = [];
  export let facetByParty = true;

  const width = 540;
  const leftPad = 132;
  const rightPad = 62;
  const rowHeight = 30;
  const topPad = 30;
  const bottomPad = 38;
  const facetPartyOrder = ['pp', 'psoe', 'vox', 'sumar', 'podemos', 'salf'];

  $: usable = effects.filter((row) => row.houseEffect != null);
  $: pollsterKeys = [...new Set(usable.map((row) => row.pollsterKey))];
  $: singlePollster = pollsterKeys.length === 1;
  $: useFacets = facetByParty && !singlePollster;
  $: parties = [...new Map(usable.map((row) => [row.partyKey, row.party])).values()].sort(
    (a, b) => partyFacetIndex(a.key) - partyFacetIndex(b.key)
  );
  $: maxAbs = Math.max(
    1,
    ...usable.flatMap((row) => [Math.abs(row.icLow ?? 0), Math.abs(row.icHigh ?? 0), Math.abs(row.houseEffect ?? 0)])
  ) * 1.15;
  $: ticks = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs];
  $: singleRows = [...usable].sort((a, b) => (b.houseEffect ?? 0) - (a.houseEffect ?? 0));
  $: singleHeight = Math.max(220, singleRows.length * rowHeight + topPad + bottomPad);

  function rowsForParty(partyKey: string): HouseEffect[] {
    return usable
      .filter((row) => row.partyKey === partyKey)
      .sort((a, b) => (b.houseEffect ?? 0) - (a.houseEffect ?? 0));
  }

  function partyFacetIndex(partyKey: string): number {
    const index = facetPartyOrder.indexOf(partyKey);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  function facetHeight(rows: HouseEffect[]): number {
    return Math.max(210, rows.length * rowHeight + topPad + bottomPad);
  }

  function x(value: number | null | undefined): number {
    const center = leftPad + (width - leftPad - rightPad) / 2;
    const scale = (width - leftPad - rightPad) / 2 / maxAbs;
    return center + (value ?? 0) * scale;
  }

  function rowLabel(row: HouseEffect): string {
    return singlePollster ? row.party.shortName : row.pollsterName ?? row.pollsterKey;
  }
</script>

{#if useFacets}
  <div class="facet-grid">
    {#each parties as party}
      {@const rows = rowsForParty(party.key)}
      {@const height = facetHeight(rows)}
      <section class="facet" aria-label={`Efectos encuestadora para ${party.shortName}`}>
        <h3>{party.shortName}</h3>
        <div class="chart-frame overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Forest plot de ${party.shortName}`}>
            <line x1={x(0)} x2={x(0)} y1={topPad - 12} y2={height - bottomPad} stroke="#1a1a2e" stroke-dasharray="4 4" />
            {#each ticks as tick}
              <line x1={x(tick)} x2={x(tick)} y1={height - bottomPad} y2={height - bottomPad + 5} stroke="#5a5a7a" />
              <text x={x(tick)} y={height - 12} text-anchor="middle" font-size="11" fill="#5a5a7a">
                {formatNumber(tick, 1)}
              </text>
            {/each}
            {#each rows as row, index}
              {@const y = topPad + index * rowHeight + rowHeight / 2}
              <text x={leftPad - 8} y={y + 4} text-anchor="end" font-size="12" font-weight="700">{rowLabel(row)}</text>
              <line x1={x(row.icLow ?? row.houseEffect)} x2={x(row.icHigh ?? row.houseEffect)} y1={y} y2={y} stroke="#5a5a7a" stroke-width="2" />
              <circle cx={x(row.houseEffect)} cy={y} r="4.2" fill={row.houseEffect && row.houseEffect > 0 ? '#15803d' : '#b91c1c'}>
                <title>{rowLabel(row)}: {formatSignedPoints(row.houseEffect, 1)}; n={row.n ?? 'n/d'}</title>
              </circle>
              <text x={width - rightPad + 10} y={y + 4} font-size="11" font-weight="800">{formatSignedPoints(row.houseEffect, 1)}</text>
            {/each}
            <text x={width - rightPad} y={height - 2} text-anchor="end" font-size="11" fill="#5a5a7a">pp</text>
          </svg>
        </div>
      </section>
    {/each}
  </div>
{:else}
  <div class="chart-frame overflow-x-auto">
    <svg viewBox={`0 0 ${width} ${singleHeight}`} role="img" aria-label="Forest plot de sesgos de encuestadora">
      <line x1={x(0)} x2={x(0)} y1={topPad - 12} y2={singleHeight - bottomPad} stroke="#1a1a2e" stroke-dasharray="4 4" />
      {#each ticks as tick}
        <line x1={x(tick)} x2={x(tick)} y1={singleHeight - bottomPad} y2={singleHeight - bottomPad + 5} stroke="#5a5a7a" />
        <text x={x(tick)} y={singleHeight - 12} text-anchor="middle" font-size="11" fill="#5a5a7a">
          {formatNumber(tick, 1)}
        </text>
      {/each}
      {#each singleRows as row, index}
        {@const y = topPad + index * rowHeight + rowHeight / 2}
        <text x={leftPad - 8} y={y + 4} text-anchor="end" font-size="13" font-weight="700">{rowLabel(row)}</text>
        <line x1={x(row.icLow ?? row.houseEffect)} x2={x(row.icHigh ?? row.houseEffect)} y1={y} y2={y} stroke="#5a5a7a" stroke-width="2" />
        <circle cx={x(row.houseEffect)} cy={y} r="4.5" fill={row.houseEffect && row.houseEffect > 0 ? '#15803d' : '#b91c1c'}>
          <title>{rowLabel(row)}: {formatSignedPoints(row.houseEffect, 1)}; n={row.n ?? 'n/d'}</title>
        </circle>
        <text x={width - rightPad + 10} y={y + 4} font-size="12" font-weight="800">{formatSignedPoints(row.houseEffect, 1)}</text>
      {/each}
      <text x={width - rightPad} y={singleHeight - 2} text-anchor="end" font-size="11" fill="#5a5a7a">pp</text>
    </svg>
  </div>
{/if}

<style>
  .facet-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .facet {
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: 0.75rem;
  }

  h3 {
    font-size: 0.9rem;
    font-weight: 800;
    margin: 0 0 0.35rem;
  }

  @media (max-width: 48rem) {
    .facet-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
