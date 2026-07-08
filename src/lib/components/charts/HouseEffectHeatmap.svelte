<script lang="ts">
  import type { PartyConfig } from '$lib/config/parties';
  import type { HouseEffect } from '$lib/data/schema';
  import { formatSignedPoints } from '$lib/utils/format';

  export let effects: HouseEffect[] = [];
  export let parties: PartyConfig[] = [];

  $: pollsters = [...new Map(effects.map((row) => [row.pollsterKey, row.pollsterName ?? row.pollsterKey])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));
  $: maxAbs = Math.max(1, ...effects.map((row) => Math.abs(row.houseEffect ?? 0)));

  function effectFor(pollsterKey: string, partyKey: string): HouseEffect | undefined {
    return effects.find((row) => row.pollsterKey === pollsterKey && row.partyKey === partyKey);
  }

  function color(value: number | null | undefined): string {
    if (value == null) return '#f3f4f6';
    const intensity = Math.min(1, Math.abs(value) / maxAbs);
    return value > 0
      ? `rgba(21, 128, 61, ${0.12 + intensity * 0.72})`
      : `rgba(185, 28, 28, ${0.12 + intensity * 0.72})`;
  }
</script>

<div class="table-scroll">
  <table class="data-table heatmap">
    <thead>
      <tr>
        <th>Encuestadora</th>
        {#each parties as party}
          <th>{party.shortName}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each pollsters as [pollsterKey, pollsterName]}
        <tr>
          <td class="font-semibold">{pollsterName}</td>
          {#each parties as party}
            {@const effect = effectFor(pollsterKey, party.key)}
            <td style={`background:${color(effect?.houseEffect)}`} title={formatSignedPoints(effect?.houseEffect, 1)}>
              {formatSignedPoints(effect?.houseEffect, 1)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .heatmap td:not(:first-child),
  .heatmap th:not(:first-child) {
    text-align: center;
    min-width: 6.5rem;
  }
</style>
