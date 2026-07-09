<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PollsterTrendChart from '$lib/components/charts/PollsterTrendChart.svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import HouseEffectNarrative from '$lib/components/polls/HouseEffectNarrative.svelte';
  import type { HouseEffect, PollsterTrendSeries } from '$lib/data/schema';
  import { getHouseEffects, getPollsterTrendSeries, loadManifest } from '$lib/data';
  import { cleanText, formatShortDate } from '$lib/utils/format';

  let loading = true;
  let errorMessage = '';
  let series: PollsterTrendSeries | null = null;
  let effects: HouseEffect[] = [];

  onMount(async () => {
    try {
      const manifest = await loadManifest();
      const pollsterKey = $page.params.pollster_key ?? '';
      [series, effects] = await Promise.all([
        pollsterKey ? getPollsterTrendSeries(pollsterKey, manifest.averageElectionKey) : Promise.resolve(null),
        pollsterKey ? getHouseEffects(pollsterKey) : Promise.resolve([])
      ]);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>{series?.pollster.pollsterName ?? 'Encuestadora'} · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  {#if loading}
    <LoadingState />
  {:else if errorMessage}
    <ErrorState message={errorMessage} />
  {:else if !series}
    <EmptyState title="Encuestadora no encontrada" />
  {:else}
    <div class="max-w-3xl">
      <p class="eyebrow">Encuestadora</p>
      <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
        {series.pollster.pollsterName}
      </h1>
      <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
        {series.pollster.nPolls} encuestas entre {formatShortDate(series.pollster.firstPollDate)} y
        {formatShortDate(series.pollster.lastPollDate)}. Medios: {cleanText(series.pollster.media.join(', '), 'Sin medios asociados')}.
      </p>
    </div>

    <section class="panel mt-8 p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Evolucion historica</h2>
      <p class="mb-4 mt-1 text-sm text-[var(--color-text-secondary)]">Puntos de la encuestadora con promedio agregado superpuesto.</p>
      <PollsterTrendChart averages={series.averages} polls={series.polls} />
    </section>

    <section class="panel mt-6 p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Sesgos de encuestadora</h2>
      <p class="mb-4 mt-1 text-sm text-[var(--color-text-secondary)]">
        Lectura interpretativa de los sesgos estimados. Los valores se expresan en puntos porcentuales.
      </p>
      <HouseEffectNarrative {effects} />
    </section>
  {/if}
</section>
