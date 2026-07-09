<script lang="ts">
  import { onMount } from 'svelte';
  import PollTrendChart from '$lib/components/charts/PollTrendChart.svelte';
  import DataFreshnessBadge from '$lib/components/layout/DataFreshnessBadge.svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import ValidationWarning from '$lib/components/layout/ValidationWarning.svelte';
  import LatestPolls from '$lib/components/polls/LatestPolls.svelte';
  import PartyFilter from '$lib/components/polls/PartyFilter.svelte';
  import PollsterCard from '$lib/components/polls/PollsterCard.svelte';
  import PollsterFilter from '$lib/components/polls/PollsterFilter.svelte';
  import type { Manifest, PollResult, PollsterSummary, PollTrendSeries, ValidationReport } from '$lib/data/schema';
  import {
    getAvailableParties,
    getLatestPolls,
    getPollsters,
    getTrendSeries,
    loadManifest,
    loadValidationReport
  } from '$lib/data';
  import type { PartyConfig } from '$lib/config/parties';
  import { formatDate, formatDateTime } from '$lib/utils/format';

  let loading = true;
  let errorMessage = '';
  let manifest: Manifest | null = null;
  let validationReport: ValidationReport | null = null;
  let parties: PartyConfig[] = [];
  let pollsters: PollsterSummary[] = [];
  let latestPolls: Array<PollResult & { results?: PollResult[] }> = [];
  let trend: PollTrendSeries = { averages: [], polls: [] };
  let selectedParties: string[] = [];
  let selectedPollsters: string[] = [];

  onMount(async () => {
    try {
      manifest = await loadManifest();
      const electionKey = manifest.averageElectionKey;
      const [report, partyRows, pollsterRows, latest, trendRows] = await Promise.all([
        loadValidationReport(),
        getAvailableParties(electionKey),
        getPollsters(electionKey),
        getLatestPolls(8),
        getTrendSeries(electionKey)
      ]);
      validationReport = report;
      parties = partyRows;
      pollsters = pollsterRows;
      latestPolls = latest as Array<PollResult & { results?: PollResult[] }>;
      trend = trendRows;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });

  function setParties(keys: string[]) {
    selectedParties = keys;
  }

  function setPollsters(keys: string[]) {
    selectedPollsters = keys;
  }

</script>

<svelte:head>
  <title>Encuestas electorales en Espana · Spain Electoral Project</title>
  <meta
    name="description"
    content="Seguimiento de encuestas electorales espanolas, promedio agregado y sesgos por encuestadora."
  />
</svelte:head>

<section class="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-14 md:py-16">
  <div class="editorial-shell">
    <div class="max-w-3xl">
      <p class="eyebrow">Spain Electoral Project</p>
      <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
        Encuestas electorales en Espana
      </h1>
      <p class="mt-5 max-w-2xl text-xl leading-8 text-[var(--color-text-secondary)]">
        Seguimiento de las estimaciones publicadas por las principales casas encuestadoras y promedio agregado.
      </p>
      <div class="mt-5">
        <DataFreshnessBadge {manifest} />
      </div>
    </div>
  </div>
</section>

<section class="editorial-shell py-8 md:py-10">
  {#if loading}
    <LoadingState />
  {:else if errorMessage}
    <ErrorState message={errorMessage} />
  {:else if manifest}
    <div class="grid gap-6">
      <ValidationWarning report={validationReport} />

      <section class="panel p-5 md:p-6">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-[var(--color-text)]">Evolucion de encuestas y promedio</h2>
            <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
              Lineas: promedio diario agregado. Puntos: encuestas individuales publicadas por cada casa.
            </p>
          </div>
        </div>

        <div class="mb-5 grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div class="grid gap-4">
            <PartyFilter {parties} selected={selectedParties} onChange={setParties} />
          </div>
          <PollsterFilter {pollsters} selected={selectedPollsters} onChange={setPollsters} />
        </div>

        {#if trend.averages.length || trend.polls.length}
          <PollTrendChart
            averages={trend.averages}
            polls={trend.polls}
            selectedPartyKeys={selectedParties}
            highlightedPollsterKeys={selectedPollsters}
          />
        {:else}
          <EmptyState />
        {/if}
      </section>

      <div class="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <section class="panel p-5">
          <div class="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-[var(--color-text)]">Ultimas encuestas</h2>
              <p class="text-sm text-[var(--color-text-secondary)]">Fichas recientes ordenadas por fecha de fin de trabajo de campo.</p>
            </div>
            <a class="text-sm font-bold text-[var(--color-accent)]" href="/encuestas">Ver todas</a>
          </div>
          <LatestPolls polls={latestPolls as never} />
        </section>

        <section class="panel p-5">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-[var(--color-text)]">Encuestadoras mas activas</h2>
            <p class="text-sm text-[var(--color-text-secondary)]">Actividad disponible en el dataset actual.</p>
          </div>
          <div class="grid gap-3">
            {#each pollsters.slice(0, 5) as pollster}
              <PollsterCard {pollster} />
            {/each}
          </div>
        </section>
      </div>

      <section class="panel p-5 md:p-6">
        <p class="eyebrow">Analisis</p>
        <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div class="max-w-3xl">
            <h2 class="text-2xl font-semibold text-[var(--color-text)]">Sesgos de encuestadora</h2>
            <p class="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Los sesgos de encuestadora resumen si una encuestadora tiende sistematicamente a estimar a un partido por encima
              o por debajo del promedio del conjunto de encuestas.
            </p>
          </div>
          <a class="text-sm font-bold text-[var(--color-accent)]" href="/house-effects">Ver analisis completo</a>
        </div>
      </section>

      <p class="text-xs text-[var(--color-text-secondary)]">
        Dataset generado el {formatDateTime(manifest.generatedAt)}. Ultimo trabajo de campo disponible:
        {formatDate(manifest.latestFieldworkEnd)}.
      </p>
    </div>
  {/if}
</section>
