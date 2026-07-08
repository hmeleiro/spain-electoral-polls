<script lang="ts">
  import type { PartyConfig } from '$lib/config/parties';

  export let parties: PartyConfig[] = [];
  export let selected: string[] = [];
  export let onChange: (keys: string[]) => void = () => {};

  function toggle(key: string) {
    const next = selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key];
    onChange(next);
  }

  function isSelected(key: string): boolean {
    return selected.length === 0 || selected.includes(key);
  }
</script>

<div class="flex flex-wrap gap-2" aria-label="Filtro de partidos">
  {#each parties as party}
    <button
      type="button"
      class="filter-chip"
      class:active={isSelected(party.key)}
      aria-pressed={isSelected(party.key)}
      on:click={() => toggle(party.key)}
    >
      <span class="h-2.5 w-2.5 rounded-full" style={`background:${party.color}`}></span>
      {party.shortName}
    </button>
  {/each}
</div>
