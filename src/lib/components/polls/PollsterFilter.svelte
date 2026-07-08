<script lang="ts">
  import type { PollsterSummary } from '$lib/data/schema';

  export let pollsters: PollsterSummary[] = [];
  export let selected: string[] = [];
  export let onChange: (keys: string[]) => void = () => {};

  let query = '';
  let open = false;
  let lastSelectedKey = '';

  $: selectedKey = selected[0] ?? '';
  $: selectedPollster = pollsters.find((pollster) => pollster.pollsterKey === selectedKey);
  $: if (selectedKey !== lastSelectedKey) {
    query = selectedPollster?.pollsterName ?? '';
    lastSelectedKey = selectedKey;
  }
  $: filteredPollsters = pollsters
    .filter((pollster) => {
      const needle = query.trim().toLowerCase();
      if (!needle || selectedPollster?.pollsterName === query) return true;
      return (
        pollster.pollsterName.toLowerCase().includes(needle) ||
        pollster.pollsterKey.toLowerCase().includes(needle)
      );
    })
    .slice(0, 8);

  function handleInput(event: Event) {
    query = (event.currentTarget as HTMLInputElement).value;
    open = true;
    if (selectedKey && query.trim() !== (selectedPollster?.pollsterName ?? '')) onChange([]);
  }

  function selectPollster(key: string) {
    const pollster = pollsters.find((row) => row.pollsterKey === key);
    query = pollster?.pollsterName ?? '';
    open = false;
    onChange(key ? [key] : []);
  }

  function clearSelection() {
    query = '';
    open = false;
    onChange([]);
  }
</script>

<div class="combobox text-sm font-semibold text-[var(--color-text-secondary)]">
  <label for="pollster-combobox">Encuestadora</label>
  <div class="combo-row">
    <input
      id="pollster-combobox"
      class="control min-w-56"
      placeholder="Todas las encuestadoras"
      value={query}
      autocomplete="off"
      role="combobox"
      aria-expanded={open}
      aria-controls="pollster-options"
      on:focus={() => (open = true)}
      on:input={handleInput}
      on:keydown={(event) => {
        if (event.key === 'Escape') open = false;
        if (event.key === 'Enter' && filteredPollsters[0]) selectPollster(filteredPollsters[0].pollsterKey);
      }}
    />
    <button type="button" class="clear-button" on:click={clearSelection} aria-label="Quitar seleccion de encuestadora">
      Todas
    </button>
  </div>

  {#if open}
    <div id="pollster-options" class="options" role="listbox">
      <button
        type="button"
        role="option"
        aria-selected={!selectedKey}
        class:selected={!selectedKey}
        on:mousedown={() => selectPollster('')}
      >
        Todas las encuestadoras
      </button>
      {#each filteredPollsters as pollster}
        <button
          type="button"
          role="option"
          aria-selected={pollster.pollsterKey === selectedKey}
          class:selected={pollster.pollsterKey === selectedKey}
          on:mousedown={() => selectPollster(pollster.pollsterKey)}
        >
          <span>{pollster.pollsterName}</span>
          <small>{pollster.nPolls} encuestas</small>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .combobox {
    display: grid;
    gap: 0.25rem;
    position: relative;
  }

  .combo-row {
    align-items: center;
    display: flex;
    gap: 0.5rem;
  }

  .clear-button {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-accent);
    font-size: 0.78rem;
    font-weight: 800;
    min-height: 2.25rem;
    padding: 0.35rem 0.65rem;
    white-space: nowrap;
  }

  .options {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    display: grid;
    left: 0;
    margin-top: 0.25rem;
    max-height: 18rem;
    overflow: auto;
    padding: 0.25rem;
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 40;
  }

  .options button {
    border-radius: var(--radius-sm);
    color: var(--color-text);
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.45rem 0.55rem;
    text-align: left;
  }

  .options button:hover,
  .options button.selected {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  small {
    color: var(--color-text-secondary);
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
