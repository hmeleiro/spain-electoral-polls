<script lang="ts">
  import { onMount } from 'svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import DateRangeFilter from '$lib/components/polls/DateRangeFilter.svelte';
  import PartyFilter from '$lib/components/polls/PartyFilter.svelte';
  import PollTable from '$lib/components/polls/PollTable.svelte';
  import type { PartyConfig } from '$lib/config/parties';
  import type { Poll, PollResult, PollsterSummary } from '$lib/data/schema';
  import { getAvailableMedia, getAvailableParties, getPollResultsForPolls, getPolls, getPollsters, loadManifest } from '$lib/data';

  let loading = true;
  let errorMessage = '';
  let parties: PartyConfig[] = [];
  let pollsters: PollsterSummary[] = [];
  let mediaOptions: string[] = [];
  let polls: Array<Poll & { results: PollResult[] }> = [];
  let selectedParties: string[] = [];
  let pollsterKey = '';
  let media = '';
  let dateRange: { from?: string; to?: string } = {};

  onMount(loadData);

  async function loadData() {
    loading = true;
    try {
      const manifest = await loadManifest();
      [parties, pollsters, mediaOptions] = await Promise.all([
        getAvailableParties(manifest.averageElectionKey),
        getPollsters(manifest.averageElectionKey),
        getAvailableMedia()
      ]);
      await reloadPolls();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  async function reloadPolls() {
    const basePolls = await getPolls({
      pollsterKeys: pollsterKey ? [pollsterKey] : undefined,
      media: media || undefined,
      dateFrom: dateRange.from,
      dateTo: dateRange.to
    });
    const selected = selectedParties.length ? new Set(selectedParties) : null;
    const resultsByPoll = await getPollResultsForPolls(basePolls.map((poll) => poll.pollId));
    const rows = basePolls.map((poll) => {
      const results = resultsByPoll.get(poll.pollId) ?? [];
      return {
        ...poll,
        results: selected ? results.filter((result) => selected.has(result.partyKey)) : results
      };
    });
    polls = rows.filter((poll) => poll.results.length);
  }

  function updateParties(keys: string[]) {
    selectedParties = keys;
    reloadPolls();
  }
</script>

<svelte:head>
  <title>Encuestas · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  <div class="max-w-3xl">
    <p class="eyebrow">Encuestas</p>
    <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">Todas las encuestas</h1>
    <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
      Consulta cada encuesta publicada y sus resultados por partido.
    </p>
  </div>

  <div class="mt-8">
    {#if loading}
      <LoadingState />
    {:else if errorMessage}
      <ErrorState message={errorMessage} />
    {:else}
      <section class="panel p-5">
        <div class="mb-5 grid gap-4 lg:grid-cols-4">
          <label class="grid gap-1 text-sm font-semibold text-[var(--color-text-secondary)]">
            Encuestadora
            <select class="control" bind:value={pollsterKey} on:change={reloadPolls}>
              <option value="">Todas</option>
              {#each pollsters as pollster}
                <option value={pollster.pollsterKey}>{pollster.pollsterName}</option>
              {/each}
            </select>
          </label>
          <label class="grid gap-1 text-sm font-semibold text-[var(--color-text-secondary)]">
            Medio
            <select class="control" bind:value={media} on:change={reloadPolls}>
              <option value="">Todos</option>
              {#each mediaOptions as item}
                <option value={item}>{item}</option>
              {/each}
            </select>
          </label>
          <div class="lg:col-span-2">
            <DateRangeFilter onChange={(range) => { dateRange = range; reloadPolls(); }} />
          </div>
        </div>
        <div class="mb-5">
          <PartyFilter {parties} selected={selectedParties} onChange={updateParties} />
        </div>
        {#if polls.length}
          <PollTable {polls} {parties} />
        {:else}
          <EmptyState />
        {/if}
      </section>
    {/if}
  </div>
</section>
