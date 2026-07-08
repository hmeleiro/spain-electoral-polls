<script lang="ts">
  import { onMount } from 'svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import PollsterCard from '$lib/components/polls/PollsterCard.svelte';
  import type { PollsterSummary } from '$lib/data/schema';
  import { getPollsters, loadManifest } from '$lib/data';

  let loading = true;
  let errorMessage = '';
  let pollsters: PollsterSummary[] = [];

  onMount(async () => {
    try {
      const manifest = await loadManifest();
      pollsters = await getPollsters(manifest.averageElectionKey);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Encuestadoras · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  <div class="max-w-3xl">
    <p class="eyebrow">Encuestadoras</p>
    <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">Directorio de encuestadoras</h1>
    <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
      Actividad, periodo cubierto, medios asociados y partidos disponibles para cada casa.
    </p>
  </div>

  <div class="mt-8">
    {#if loading}
      <LoadingState />
    {:else if errorMessage}
      <ErrorState message={errorMessage} />
    {:else if pollsters.length}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each pollsters as pollster}
          <PollsterCard {pollster} />
        {/each}
      </div>
    {:else}
      <EmptyState />
    {/if}
  </div>
</section>
