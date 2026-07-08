<script lang="ts">
  import type { PollResult } from '$lib/data/schema';
  import { formatPercent } from '$lib/utils/format';

  export let results: PollResult[] = [];

  const width = 720;
  const leftPad = 96;
  const rightPad = 74;
  const rowHeight = 42;
  const topPad = 18;
  const bottomPad = 32;

  $: data = [...results].sort((a, b) => (b.voteShare ?? -1) - (a.voteShare ?? -1));
  $: height = Math.max(220, data.length * rowHeight + topPad + bottomPad);
  $: maxValue = Math.max(1, ...data.map((row) => row.voteShare ?? 0)) * 1.12;
  $: x = (value: number | null | undefined) => leftPad + ((value ?? 0) / maxValue) * (width - leftPad - rightPad);
</script>

<div class="chart-frame overflow-x-auto">
  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Resultados de la encuesta por partido">
    {#each data as row, index}
      {@const y = topPad + index * rowHeight + rowHeight / 2}
      <text x={leftPad - 10} y={y + 5} text-anchor="end" font-size="16" font-weight="700">{row.shortName}</text>
      <rect x={leftPad} y={y - 14} width={Math.max(1, x(row.voteShare) - leftPad)} height="28" rx="2" fill={row.colorHex} />
      <text x={Math.min(width - 8, x(row.voteShare) + 8)} y={y + 5} font-size="15" font-weight="800">
        {formatPercent(row.voteShare, 1)}
      </text>
    {/each}
  </svg>
</div>
