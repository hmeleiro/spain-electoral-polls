<script lang="ts">
  import { formatShortDate } from '$lib/utils/format';

  export let dateFrom = '';
  export let dateTo = '';
  export let minDate = '';
  export let maxDate = '';
  export let onChange: (range: { from?: string; to?: string }) => void = () => {};

  $: sliderEnabled = Boolean(minDate && maxDate && minDate <= maxDate);
  $: minDay = sliderEnabled ? dateToDay(minDate) : 0;
  $: maxDay = sliderEnabled ? dateToDay(maxDate) : 0;
  $: fromDay = sliderEnabled ? dateToDay(dateFrom || minDate) : 0;
  $: toDay = sliderEnabled ? dateToDay(dateTo || maxDate) : 0;

  function emit(nextFrom = dateFrom, nextTo = dateTo) {
    onChange({ from: nextFrom || undefined, to: nextTo || undefined });
  }

  function updateFrom(value: string) {
    const day = Math.min(Number(value), toDay);
    dateFrom = dayToDate(day);
    emit(dateFrom === minDate ? '' : dateFrom, dateTo === maxDate ? '' : dateTo);
  }

  function updateTo(value: string) {
    const day = Math.max(Number(value), fromDay);
    dateTo = dayToDate(day);
    emit(dateFrom === minDate ? '' : dateFrom, dateTo === maxDate ? '' : dateTo);
  }

  function reset() {
    dateFrom = '';
    dateTo = '';
    emit('', '');
  }

  function dateToDay(value: string): number {
    return Math.floor(new Date(`${value}T00:00:00`).getTime() / 86400000);
  }

  function dayToDate(value: number): string {
    return new Date(value * 86400000).toISOString().slice(0, 10);
  }
</script>

{#if sliderEnabled}
  <div class="grid gap-2">
    <div class="flex flex-wrap items-baseline justify-between gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
      <span>Periodo</span>
      <span class="text-xs">
        {formatShortDate(dateFrom || minDate)} - {formatShortDate(dateTo || maxDate)}
      </span>
    </div>
    <div class="range-shell" style={`--from:${((fromDay - minDay) / Math.max(1, maxDay - minDay)) * 100}%;--to:${((toDay - minDay) / Math.max(1, maxDay - minDay)) * 100}%`}>
      <div class="range-track"></div>
      <div class="range-selection"></div>
      <input
        aria-label="Fecha inicial"
        type="range"
        min={minDay}
        max={maxDay}
        value={fromDay}
        on:input={(event) => updateFrom((event.currentTarget as HTMLInputElement).value)}
      />
      <input
        aria-label="Fecha final"
        type="range"
        min={minDay}
        max={maxDay}
        value={toDay}
        on:input={(event) => updateTo((event.currentTarget as HTMLInputElement).value)}
      />
    </div>
    <button type="button" class="self-start text-xs font-bold text-[var(--color-accent)]" on:click={reset}>
      Mostrar todo el periodo
    </button>
  </div>
{:else}
  <div class="flex flex-wrap gap-3">
    <label class="grid gap-1 text-sm font-semibold text-[var(--color-text-secondary)]">
      Desde
      <input
        class="control"
        type="date"
        value={dateFrom}
        on:input={(event) => {
          dateFrom = (event.currentTarget as HTMLInputElement).value;
          emit(dateFrom, dateTo);
        }}
      />
    </label>
    <label class="grid gap-1 text-sm font-semibold text-[var(--color-text-secondary)]">
      Hasta
      <input
        class="control"
        type="date"
        value={dateTo}
        on:input={(event) => {
          dateTo = (event.currentTarget as HTMLInputElement).value;
          emit(dateFrom, dateTo);
        }}
      />
    </label>
  </div>
{/if}

<style>
  .range-shell {
    height: 2rem;
    position: relative;
  }

  .range-track,
  .range-selection {
    border-radius: 999px;
    height: 0.28rem;
    left: 0;
    position: absolute;
    right: 0;
    top: 0.85rem;
  }

  .range-track {
    background: var(--color-border);
  }

  .range-selection {
    background: var(--color-accent);
    left: var(--from);
    right: calc(100% - var(--to));
  }

  input[type='range'] {
    appearance: none;
    background: transparent;
    height: 2rem;
    inset: 0;
    margin: 0;
    pointer-events: none;
    position: absolute;
    width: 100%;
  }

  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    background: #ffffff;
    border: 2px solid var(--color-accent);
    border-radius: 999px;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    height: 1rem;
    pointer-events: auto;
    width: 1rem;
  }

  input[type='range']::-moz-range-thumb {
    background: #ffffff;
    border: 2px solid var(--color-accent);
    border-radius: 999px;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    height: 1rem;
    pointer-events: auto;
    width: 1rem;
  }
</style>
