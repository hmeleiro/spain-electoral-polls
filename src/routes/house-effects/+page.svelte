<script lang="ts">
  import { onMount } from 'svelte';
  import HouseEffectHeatmap from '$lib/components/charts/HouseEffectHeatmap.svelte';
  import HouseEffectPlot from '$lib/components/charts/HouseEffectPlot.svelte';
  import EmptyState from '$lib/components/layout/EmptyState.svelte';
  import ErrorState from '$lib/components/layout/ErrorState.svelte';
  import LoadingState from '$lib/components/layout/LoadingState.svelte';
  import type { PartyConfig } from '$lib/config/parties';
  import type { HouseEffect } from '$lib/data/schema';
  import { getAvailableParties, getHouseEffects, loadManifest } from '$lib/data';

  let loading = true;
  let errorMessage = '';
  let effects: HouseEffect[] = [];
  let parties: PartyConfig[] = [];

  onMount(async () => {
    try {
      const manifest = await loadManifest();
      [parties, effects] = await Promise.all([
        getAvailableParties(manifest.averageElectionKey),
        getHouseEffects(undefined, undefined, manifest.averageElectionKey)
      ]);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Sesgos de encuestadoras · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  <div class="max-w-3xl">
    <p class="eyebrow">Efectos encuestadora</p>
    <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
       Sesgos de encuestadora
    </h1>
    <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
      Un efecto casa mide si una encuestadora tiende sistematicamente a estimar a un partido por encima o por
      debajo del promedio del conjunto de encuestas. No es una prueba de manipulacion ni de sesgo intencional.
    </p>
  </div>

  <div class="mt-8">
    {#if loading}
      <LoadingState />
    {:else if errorMessage}
      <ErrorState message={errorMessage} />
    {:else if effects.length}
      <div class="grid gap-6">
        <section class="panel p-5">
          <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-[var(--color-text)]">Sesgos de encuestadora por partido</h2>
              <p class="text-sm text-[var(--color-text-secondary)]">
                Las mediciones cuyos intervalos de confianza cruzan cero se consideran estadísticamente indistinguibles del promedio.
              </p>
            </div>
          </div>
          <HouseEffectPlot {effects} />
        </section>

        <section class="panel p-5">
          <h2 class="text-xl font-semibold text-[var(--color-text)]">Matriz encuestadora x partido</h2>
          <p class="mb-4 mt-1 text-sm text-[var(--color-text-secondary)]">
            Solo se colorean los sesgos estadisticamente significativos.
          </p>
          <HouseEffectHeatmap {effects} {parties} />
        </section>
      </div>
    {:else}
      <EmptyState />
    {/if}
  </div>
</section>
