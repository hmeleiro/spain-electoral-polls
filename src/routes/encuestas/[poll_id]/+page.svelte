<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PollDeviationChart from '$lib/components/charts/PollDeviationChart.svelte';
  import PollResultsChart from '$lib/components/charts/PollResultsChart.svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import type { PollDetail } from '$lib/data/schema';
  import { getPollDetail } from '$lib/data';
  import { cleanText, formatDate, formatNumber } from '$lib/utils/format';
  import { externalUrl } from '$lib/utils/urls';

  let loading = true;
  let errorMessage = '';
  let detail: PollDetail | null = null;

  onMount(async () => {
    try {
      const pollId = $page.params.poll_id ?? '';
      detail = pollId ? await getPollDetail(pollId) : null;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>{detail?.poll.pollsterName ?? 'Encuesta'} · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  {#if loading}
    <LoadingState />
  {:else if errorMessage}
    <ErrorState message={errorMessage} />
  {:else if !detail}
    <EmptyState title="Encuesta no encontrada" message="No hay una encuesta con ese identificador en el dataset actual." />
  {:else}
    <div class="max-w-3xl">
      <p class="eyebrow">Ficha de encuesta</p>
      <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
        {detail.poll.pollsterName}
      </h1>
      <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
        {formatDate(detail.poll.date)} · {cleanText(detail.poll.media, 'Sin medio')}
      </p>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section class="panel p-5">
        <h2 class="text-xl font-semibold text-[var(--color-text)]">Informacion general</h2>
        <dl class="mt-4 grid gap-3 text-sm">
          <div><dt>Trabajo de campo</dt><dd>{formatDate(detail.poll.fieldworkStart)} - {formatDate(detail.poll.fieldworkEnd)}</dd></div>
          <div><dt>Publicacion</dt><dd>{formatDate(detail.poll.publicationDate)}</dd></div>
          <div><dt>Muestra</dt><dd>{formatNumber(detail.poll.sampleSize)}{detail.poll.sampleSizeImputed ? ' (imputada)' : ''}</dd></div>
          <div><dt>Fuente</dt><dd>{cleanText(detail.poll.sourceTitle, 'Fuente no disponible')}</dd></div>
        </dl>
        {#if externalUrl(detail.poll.sourceUrl)}
          <a class="mt-4 inline-block text-sm font-bold text-[var(--color-accent)]" href={externalUrl(detail.poll.sourceUrl) ?? ''} target="_blank" rel="noopener">
            Ver fuente original
          </a>
        {/if}
      </section>

      <section class="panel p-5">
        <h2 class="text-xl font-semibold text-[var(--color-text)]">Resultados</h2>
        <PollResultsChart results={detail.results} />
      </section>
    </div>

    <section class="panel mt-6 p-5">
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-[var(--color-text)]">Comparacion con el promedio</h2>
        <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
          La comparacion se realiza frente al promedio agregado estimado para la fecha de la encuesta.
        </p>
      </div>
      <PollDeviationChart deviations={detail.deviations} />
    </section>
  {/if}
</section>

<style>
  dt {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  dd {
    margin: 0.15rem 0 0;
    font-weight: 650;
  }
</style>
