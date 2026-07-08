<script lang="ts">
  import type { PollDeviation } from '$lib/data/schema';
  import { formatPercent, formatSignedPoints } from '$lib/utils/format';

  export let deviations: PollDeviation[] = [];

  const width = 760;
  const leftPad = 112;
  const rightPad = 158;
  const rowHeight = 42;
  const topPad = 20;
  const bottomPad = 32;

  $: data = [...deviations].sort((a, b) => Math.abs(b.deviationFromAverage ?? 0) - Math.abs(a.deviationFromAverage ?? 0));
  $: height = Math.max(240, data.length * rowHeight + topPad + bottomPad);
  $: maxAbs = Math.max(1, ...data.map((row) => Math.abs(row.deviationFromAverage ?? 0))) * 1.2;
  $: center = leftPad + (width - leftPad - rightPad) / 2;
  $: scale = (width - leftPad - rightPad) / 2 / maxAbs;
</script>

<div class="chart-frame overflow-x-auto">
  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Desviacion respecto al promedio agregado">
    <line x1={center} x2={center} y1={topPad - 8} y2={height - bottomPad} stroke="#1a1a2e" stroke-width="1.5" />
    {#each data as row, index}
      {@const y = topPad + index * rowHeight + rowHeight / 2}
      {@const value = row.deviationFromAverage ?? 0}
      {@const x2 = center + value * scale}
      <text x={leftPad - 10} y={y + 5} text-anchor="end" font-size="15" font-weight="700">{row.shortName}</text>
      <line x1={center} x2={x2} y1={y} y2={y} stroke={value >= 0 ? '#15803d' : '#b91c1c'} stroke-width="8" stroke-linecap="round" />
      <circle cx={x2} cy={y} r="5" fill="white" stroke={value >= 0 ? '#15803d' : '#b91c1c'} stroke-width="2" />
      <text x={width - rightPad + 18} y={y - 2} font-size="13" font-weight="800">{formatSignedPoints(row.deviationFromAverage, 1)}</text>
      <text x={width - rightPad + 18} y={y + 15} font-size="11" fill="#5a5a7a">
        {formatPercent(row.voteShare, 1)} vs {formatPercent(row.averageVoteShare, 1)}
      </text>
    {/each}
  </svg>
</div>
