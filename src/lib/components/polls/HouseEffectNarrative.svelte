<script lang="ts">
  import type { HouseEffect } from '$lib/data/schema';
  import { formatSignedPoints } from '$lib/utils/format';

  export let effects: HouseEffect[] = [];

  $: sortedEffects = [...effects].sort(
    (a, b) => Math.abs(b.houseEffect ?? 0) - Math.abs(a.houseEffect ?? 0)
  );
  $: notableEffects = sortedEffects.filter((effect) => effect.houseEffectStatus !== 'unclear');
  $: unclearEffects = sortedEffects.filter((effect) => effect.houseEffectStatus === 'unclear');

  function tone(effect: HouseEffect): 'positive' | 'negative' | 'neutral' {
    if (effect.houseEffectStatus === 'positive') return 'positive';
    if (effect.houseEffectStatus === 'negative') return 'negative';
    return 'neutral';
  }

  function sentence(effect: HouseEffect): string {
    const direction = (effect.houseEffect ?? 0) >= 0 ? 'por encima' : 'por debajo';
    return `Tiende a estimar a ${effect.party.shortName} ${direction} del promedio agregado.`;
  }

  function interval(effect: HouseEffect): string {
    if (effect.icLow == null || effect.icHigh == null) return 'Intervalo no disponible';
    return `Intervalo: ${formatSignedPoints(effect.icLow, 1)} a ${formatSignedPoints(effect.icHigh, 1)}`;
  }
</script>

<div class="grid gap-4">
  {#if notableEffects.length}
    <div class="grid gap-3 md:grid-cols-2">
      {#each notableEffects as effect}
        <article class={`effect-card ${tone(effect)}`}>
          <div class="flex items-start justify-between gap-3">
            <h3>{effect.party.shortName}</h3>
            <strong>{formatSignedPoints(effect.houseEffect, 1)}</strong>
          </div>
          <p>{sentence(effect)}</p>
          <p class="meta">{interval(effect)} · n={effect.n ?? 'n/d'}</p>
        </article>
      {/each}
    </div>
  {:else}
    <div class="effect-card neutral">
      <h3>Sin efectos casa claros</h3>
      <p>No hay señales concluyentes de que esta encuestadora se aparte sistematicamente del promedio para los partidos disponibles.</p>
    </div>
  {/if}

  {#if unclearEffects.length}
    <section class="panel-subtle">
      <h3>Efectos no concluyentes</h3>
      <p>
        Para {unclearEffects.map((effect) => effect.party.shortName).join(', ')}, el intervalo disponible no permite
        distinguir con claridad un efecto sistematico respecto al promedio.
      </p>
    </section>
  {/if}
</div>

<style>
  .effect-card,
  .panel-subtle {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .effect-card h3,
  .panel-subtle h3 {
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0;
  }

  .effect-card p,
  .panel-subtle p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.55;
    margin: 0.55rem 0 0;
  }

  .effect-card strong {
    font-size: 1.05rem;
  }

  .effect-card.positive {
    background: #f2fbf5;
    border-color: #bbebc9;
  }

  .effect-card.negative {
    background: #fff5f5;
    border-color: #f0c1c1;
  }

  .effect-card.neutral,
  .panel-subtle {
    background: #ffffff;
  }

  .meta {
    font-size: 0.78rem !important;
    font-weight: 700;
  }
</style>
