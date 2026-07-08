<script lang="ts">
  import type { PollAveragePoint, PollResult } from '$lib/data/schema';
  import { formatPercent, formatShortDate } from '$lib/utils/format';
  import { onMount } from 'svelte';

  export let averages: PollAveragePoint[] = [];
  export let polls: PollResult[] = [];
  export let showAverage = true;
  export let showPolls = true;
  export let highlightedPollsterKeys: string[] = [];
  export let selectedPartyKeys: string[] = [];

  const DAY = 86400000;
  const chartHeight = 390;
  const marginLeft = 46;
  const marginRight = 34;
  const marginTop = 18;
  const marginBottom = 36;

  let container: HTMLDivElement;
  let chartWidth = 720;
  let activePollId: string | null = null;
  let activeAverageDateMs: number | null = null;
  let zoomStartDay: number | null = null;
  let zoomEndDay: number | null = null;
  let lastStateToken = '';
  let tooltip: {
    x: number;
    y: number;
    title: string;
    rows: PollPoint[];
    meta: string[];
    alignRight: boolean;
  } | null = null;

  type AveragePoint = PollAveragePoint & { dateMs: number; dateValue: Date };
  type PollPoint = PollResult & { dateMs: number; dateValue: Date };
  type PlottedAveragePoint = AveragePoint & { x: number; y: number };
  type AverageCard = {
    partyKey: string;
    shortName: string;
    color: string;
    averageVoteShare: number | null;
    nPollsDay: number | null;
  };
  type PlottedPollPoint = PollPoint & {
    x: number;
    y: number;
    pointOpacity: number;
    isPollsterHighlighted: boolean;
    isHighlighted: boolean;
    hitRadius: number;
    highlightRadius: number;
    highlightStrokeWidth: number;
  };

  $: averageRows = averages.map(toAveragePoint).filter(isAveragePoint);
  $: pollRows = polls.map(toPollPoint).filter(isPollPoint);
  $: pollRowsById = groupPollRowsById(pollRows);
  $: selectedParties = new Set(selectedPartyKeys);
  $: hasPartyFilter = selectedParties.size > 0;
  $: selectedPollsters = new Set(highlightedPollsterKeys.filter(Boolean));
  $: hasPollsterHighlight = selectedPollsters.size > 0;
  $: displayedAverageRows = hasPartyFilter
    ? averageRows.filter((row) => selectedParties.has(row.partyKey))
    : averageRows;
  $: displayedPollRows = hasPartyFilter ? pollRows.filter((row) => selectedParties.has(row.partyKey)) : pollRows;
  $: fullDomain = extentTime([...displayedAverageRows, ...displayedPollRows]);
  $: fullStartDay = timeToDay(fullDomain.min);
  $: fullEndDay = timeToDay(fullDomain.max);
  $: activeRange = normalizeDayRange(zoomStartDay, zoomEndDay, fullStartDay, fullEndDay);
  $: activeStartDay = activeRange.start;
  $: activeEndDay = activeRange.end;
  $: xDomain = {
    min: dayToTime(activeStartDay),
    max: dayToTime(activeEndDay)
  };
  $: visibleAverageRows = displayedAverageRows.filter(
    (row) => row.dateMs >= xDomain.min && row.dateMs <= xDomain.max
  );
  $: visibleAverageCardRows = averageRows.filter((row) => row.dateMs >= xDomain.min && row.dateMs <= xDomain.max);
  $: visiblePollRows = displayedPollRows.filter((row) => row.dateMs >= xDomain.min && row.dateMs <= xDomain.max);
  $: rawYDomain = extentY(visibleAverageRows, visiblePollRows);
  $: yTicks = buildYTicks(rawYDomain.max);
  $: yDomain = { min: 0, max: yTicks.at(-1) ?? rawYDomain.max };
  $: plotWidth = Math.max(1, chartWidth - marginLeft - marginRight);
  $: plotHeight = Math.max(1, chartHeight - marginTop - marginBottom);
  $: xTicks = buildTimeTicks(xDomain.min, xDomain.max);
  $: plottedAverageRows = visibleAverageRows.map((row) => ({
    ...row,
    x: scaleX(row.dateMs, xDomain.min, xDomain.max, plotWidth),
    y: scaleY(row.averageVoteShare ?? yDomain.min, yDomain.min, yDomain.max, plotHeight)
  }));
  $: plottedPollRows = visiblePollRows.map((row) => {
    const isActivePoll = activePollId === row.pollId;
    const isPollsterHighlight = hasPollsterHighlight && selectedPollsters.has(row.pollsterKey);
    const isHighlighted = activePollId ? isActivePoll : isPollsterHighlight;
    return {
      ...row,
      x: scaleX(row.dateMs, xDomain.min, xDomain.max, plotWidth),
      y: scaleY(row.voteShare ?? yDomain.min, yDomain.min, yDomain.max, plotHeight),
      pointOpacity: activePollId ? (isActivePoll ? 0.95 : 0.12) : isPollsterHighlight ? 0.86 : hasPollsterHighlight ? 0.12 : 0.4,
      isPollsterHighlighted: isPollsterHighlight,
      isHighlighted,
      hitRadius: isHighlighted ? 8 : 5,
      highlightRadius: isActivePoll ? 5.2 : 4.4,
      highlightStrokeWidth: isActivePoll ? 2.4 : 1.9
    };
  });
  $: plottedPollRowsById = groupPlottedPollRowsById(plottedPollRows);
  $: activePollRows = activePollId ? (plottedPollRowsById.get(activePollId) ?? []) : [];
  $: plottedXTicks = xTicks.map((tick) => ({
    value: tick,
    x: scaleX(tick.getTime(), xDomain.min, xDomain.max, plotWidth)
  }));
  $: plottedYTicks = yTicks.map((tick) => ({
    value: tick,
    y: scaleY(tick, yDomain.min, yDomain.max, plotHeight)
  }));
  $: averageGroups = groupAverageRows(plottedAverageRows);
  $: latestAverageDateMs = latestDateMs(visibleAverageCardRows);
  $: shownAverageDateMs = activeAverageDateMs ?? latestAverageDateMs;
  $: averageCardOrder = buildAverageCardOrder(visibleAverageCardRows, latestAverageDateMs);
  $: averageCards = buildAverageCards(visibleAverageCardRows, shownAverageDateMs, averageCardOrder);
  $: averageCardDate = shownAverageDateMs == null ? null : new Date(shownAverageDateMs).toISOString().slice(0, 10);
  $: averageCardMode = activeAverageDateMs == null ? 'Ultima estimacion' : 'Fecha del punto';
  $: stateToken = `${selectedPartyKeys.join(',')}:${highlightedPollsterKeys.join(',')}:${activeStartDay}:${activeEndDay}:${pollRows.map((row) => `${row.pollId}-${row.partyKey}-${row.date}`).join('|')}`;
  $: if (stateToken !== lastStateToken) {
    hideTooltip();
    lastStateToken = stateToken;
  }
  $: if (activePollId && !plottedPollRowsById.has(activePollId)) hideTooltip();

  function showTooltip(row: PlottedPollPoint) {
    activePollId = row.pollId;
    activeAverageDateMs = row.dateMs;
    const rows = pollRowsById.get(row.pollId) ?? [];
    tooltip = {
      x: Math.min(Math.max(row.x, 12), chartWidth - 12),
      y: Math.min(Math.max(row.y, 54), chartHeight - 54),
      alignRight: row.x > chartWidth - 300,
      title: row.pollsterName,
      rows,
      meta: [formatShortDate(row.date), row.media ? `Medio: ${row.media}` : 'Medio: n/d']
    };
  }

  function hideTooltip() {
    activePollId = null;
    activeAverageDateMs = null;
    tooltip = null;
  }

  function scaleX(value: number, min: number, max: number, width: number): number {
    const span = Math.max(1, max - min);
    return marginLeft + ((value - min) / span) * width;
  }

  function scaleY(value: number, min: number, max: number, height: number): number {
    const span = Math.max(1, max - min);
    return marginTop + ((max - value) / span) * height;
  }

  function linePath(rows: PlottedAveragePoint[]): string {
    return rows
      .filter((row) => row.averageVoteShare != null)
      .map((row, index) => `${index === 0 ? 'M' : 'L'}${row.x.toFixed(2)},${row.y.toFixed(2)}`)
      .join(' ');
  }

  function updateZoomStart(value: string) {
    const next = Math.min(Number(value), activeEndDay - 1);
    zoomStartDay = next <= fullStartDay ? null : next;
    hideTooltip();
  }

  function updateZoomEnd(value: string) {
    const next = Math.max(Number(value), activeStartDay + 1);
    zoomEndDay = next >= fullEndDay ? null : next;
    hideTooltip();
  }

  function resetZoom() {
    zoomStartDay = null;
    zoomEndDay = null;
    hideTooltip();
  }

  function toAveragePoint(row: PollAveragePoint): AveragePoint {
    const dateMs = parseDateMs(row.date);
    return { ...row, dateMs, dateValue: new Date(dateMs) };
  }

  function toPollPoint(row: PollResult): PollPoint {
    const dateMs = parseDateMs(row.date);
    return { ...row, dateMs, dateValue: new Date(dateMs) };
  }

  function isAveragePoint(row: AveragePoint): row is AveragePoint {
    return Number.isFinite(row.dateMs) && row.averageVoteShare != null;
  }

  function isPollPoint(row: PollPoint): row is PollPoint {
    return Number.isFinite(row.dateMs) && row.voteShare != null;
  }

  function parseDateMs(value: string | null | undefined): number {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
    if (!match) return Number.NaN;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function timeToDay(value: number): number {
    return Math.floor(value / DAY);
  }

  function dayToTime(value: number): number {
    return value * DAY;
  }

  function dayToDate(value: number): string {
    return new Date(dayToTime(value)).toISOString().slice(0, 10);
  }

  function normalizeDayRange(
    start: number | null,
    end: number | null,
    fullStart: number,
    fullEnd: number
  ): { start: number; end: number } {
    if (!Number.isFinite(fullStart) || !Number.isFinite(fullEnd)) return { start: 0, end: 1 };
    if (fullEnd <= fullStart) return { start: fullStart, end: fullStart + 1 };
    const min = fullStart;
    const max = fullEnd;
    const clampedStart = clamp(start ?? min, min, max - 1);
    const clampedEnd = clamp(end ?? max, min + 1, max);
    if (clampedStart < clampedEnd) return { start: clampedStart, end: clampedEnd };
    return { start: Math.max(min, clampedEnd - 1), end: clampedEnd };
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function extentTime(rows: Array<{ dateMs: number }>): { min: number; max: number } {
    const values = rows.map((row) => row.dateMs).filter(Number.isFinite).sort((a, b) => a - b);
    const fallback = Date.now();
    return { min: values[0] ?? fallback, max: values.at(-1) ?? values[0] ?? fallback };
  }

  function extentY(
    averageSource: Array<{ averageVoteShare: number | null }>,
    pollSource: Array<{ voteShare: number | null }>
  ): { min: number; max: number } {
    const values = [
      0,
      ...averageSource.map((row) => row.averageVoteShare ?? null),
      ...pollSource.map((row) => row.voteShare ?? null)
    ].filter((value): value is number => value != null && Number.isFinite(value));
    return { min: 0, max: Math.max(1, ...values) * 1.08 };
  }

  function buildYTicks(max: number): number[] {
    const step = max <= 12 ? 1 : max <= 24 ? 2 : 5;
    const last = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let value = 0; value <= last; value += step) ticks.push(value);
    return ticks;
  }

  function buildTimeTicks(min: number, max: number): Date[] {
    const start = new Date(min);
    const end = new Date(max);
    const monthSpan =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
    const step = monthSpan > 30 ? 6 : monthSpan > 14 ? 3 : monthSpan > 7 ? 2 : 1;
    const firstMonth = Math.floor(start.getUTCMonth() / step) * step;
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), firstMonth, 1));
    while (cursor.getTime() < min) cursor.setUTCMonth(cursor.getUTCMonth() + step);
    const ticks: Date[] = [];
    while (cursor.getTime() <= max) {
      ticks.push(new Date(cursor));
      cursor.setUTCMonth(cursor.getUTCMonth() + step);
    }
    return ticks;
  }

  function groupAverageRows(
    rows: PlottedAveragePoint[]
  ): Array<{ key: string; color: string; rows: PlottedAveragePoint[] }> {
    const groups = new Map<string, PlottedAveragePoint[]>();
    for (const row of rows) groups.set(row.partyKey, [...(groups.get(row.partyKey) ?? []), row]);
    return [...groups.entries()].map(([key, groupRows]) => ({
      key,
      color: groupRows[0]?.party.color ?? '#8f8b85',
      rows: groupRows.sort((a, b) => a.dateMs - b.dateMs)
    }));
  }

  function groupPollRowsById(rows: PollPoint[]): Map<string, PollPoint[]> {
    const groups = new Map<string, PollPoint[]>();
    for (const row of rows) {
      const groupRows = groups.get(row.pollId);
      if (groupRows) groupRows.push(row);
      else groups.set(row.pollId, [row]);
    }
    for (const [pollId, groupRows] of groups) {
      groups.set(
        pollId,
        groupRows.sort((a, b) => (b.voteShare ?? -1) - (a.voteShare ?? -1))
      );
    }
    return groups;
  }

  function groupPlottedPollRowsById(rows: PlottedPollPoint[]): Map<string, PlottedPollPoint[]> {
    const groups = new Map<string, PlottedPollPoint[]>();
    for (const row of rows) {
      const groupRows = groups.get(row.pollId);
      if (groupRows) groupRows.push(row);
      else groups.set(row.pollId, [row]);
    }
    return groups;
  }

  function latestDateMs(rows: AveragePoint[]): number | null {
    const values = rows.map((row) => row.dateMs).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  }

  function buildAverageCardOrder(rows: AveragePoint[], dateMs: number | null): string[] {
    const byParty = new Map<string, AveragePoint>();
    const latestRows = dateMs == null ? [] : rows.filter((row) => row.dateMs === dateMs);
    for (const row of rows) if (!byParty.has(row.partyKey)) byParty.set(row.partyKey, row);
    const latestValue = new Map(latestRows.map((row) => [row.partyKey, row.averageVoteShare ?? -1]));

    return [...byParty.keys()].sort((a, b) => {
      const valueDiff = (latestValue.get(b) ?? -1) - (latestValue.get(a) ?? -1);
      if (valueDiff !== 0) return valueDiff;
      return (byParty.get(a)?.party.shortName ?? a).localeCompare(byParty.get(b)?.party.shortName ?? b, 'es');
    });
  }

  function buildAverageCards(rows: AveragePoint[], dateMs: number | null, order: string[]): AverageCard[] {
    const partyRows = new Map<string, AveragePoint>();
    const valueRows = new Map<string, AveragePoint>();

    for (const row of rows) {
      if (!partyRows.has(row.partyKey)) partyRows.set(row.partyKey, row);
      if (dateMs != null && row.dateMs === dateMs) valueRows.set(row.partyKey, row);
    }

    return order
      .map((partyKey) => {
        const partyRow = partyRows.get(partyKey);
        const valueRow = valueRows.get(partyKey);
        if (!partyRow) return null;
        return {
          partyKey,
          shortName: partyRow.party.shortName,
          color: partyRow.party.color,
          averageVoteShare: valueRow?.averageVoteShare ?? null,
          nPollsDay: valueRow?.nPollsDay ?? null
        };
      })
      .filter((card): card is AverageCard => card != null);
  }

  onMount(() => {
    const updateWidth = () => {
      chartWidth = Math.max(320, container?.clientWidth ?? 720);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<div bind:this={container} class="chart-shell">
  {#if showAverage && averageCards.length}
    <section class="average-summary" aria-label="Promedio agregado por partido" aria-live="polite">
      <div class="average-summary-header">
        <span>{averageCardMode}</span>
        <strong>{averageCardDate ? formatShortDate(averageCardDate) : 'n/d'}</strong>
      </div>
      <div class="average-card-grid">
        {#each averageCards as card (card.partyKey)}
          <article class="average-card" style={`--party-color:${card.color}`}>
            <div class="average-card-topline">
              <span class="average-swatch"></span>
              <span>{card.shortName}</span>
            </div>
            <strong>{formatPercent(card.averageVoteShare, 1)}</strong>
            <!-- <span>{card.nPollsDay == null ? 'n encuestas n/d' : `${card.nPollsDay} encuestas ese dia`}</span> -->
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <svg
    class="trend-chart"
    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
    role="img"
    aria-label="Evolucion temporal de encuestas y promedio agregado"
    on:pointerleave={hideTooltip}
  >
    <defs>
      <clipPath id="poll-trend-clip">
        <rect x={marginLeft} y={marginTop} width={plotWidth} height={plotHeight} />
      </clipPath>
    </defs>

    <g class="grid">
      {#each plottedYTicks as tick}
        <line x1={marginLeft} x2={chartWidth - marginRight} y1={tick.y} y2={tick.y} />
      {/each}
      {#each plottedXTicks as tick}
        <line x1={tick.x} x2={tick.x} y1={marginTop} y2={chartHeight - marginBottom} />
      {/each}
    </g>

    <g class="axes">
      <line x1={marginLeft} x2={chartWidth - marginRight} y1={chartHeight - marginBottom} y2={chartHeight - marginBottom} />
      <text x={marginLeft - 42} y={marginTop - 6}>Voto (%)</text>
      {#each plottedYTicks as tick}
        <text x={marginLeft - 8} y={tick.y + 4} text-anchor="end">{tick.value}%</text>
      {/each}
      {#each plottedXTicks as tick}
        <text x={tick.x} y={chartHeight - 12} text-anchor="middle">
          {new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(tick.value)}
        </text>
      {/each}
    </g>

    <g clip-path="url(#poll-trend-clip)">
      {#if showAverage}
        {#each averageGroups as group (group.key)}
          <path class="average-line" d={linePath(group.rows)} stroke={group.color} />
        {/each}
      {/if}

      {#if showPolls}
        <g class="poll-point-layer" opacity={activePollId ? 0.7 : 1}>
          {#each plottedPollRows as row (`point-${row.pollId}-${row.partyKey}`)}
            <circle
              cx={row.x}
              cy={row.y}
              r="2.6"
              fill={row.colorHex}
              opacity={row.pointOpacity}
              pointer-events="none"
            />
          {/each}
        </g>

        <g class="pollster-highlight-layer" opacity={activePollId ? 0.7 : 1}>
          {#each plottedPollRows as row (`highlight-${row.pollId}-${row.partyKey}`)}
            {#if row.isPollsterHighlighted}
              <circle
                cx={row.x}
                cy={row.y}
                r="4.4"
                fill="white"
                stroke={row.colorHex}
                stroke-width="1.9"
                pointer-events="none"
              />
            {/if}
          {/each}
        </g>

        {#if activePollRows.length}
          <g class="active-poll-layer">
            {#each activePollRows as row (`active-${row.pollId}-${row.partyKey}`)}
              <circle
                cx={row.x}
                cy={row.y}
                r="5.2"
                fill="white"
                stroke={row.colorHex}
                stroke-width="2.4"
                pointer-events="none"
              />
            {/each}
          </g>
        {/if}
      {/if}
    </g>

    {#if showPolls}
      <g class="hit-layer">
        {#each plottedPollRows as row (`hit-${row.pollId}-${row.partyKey}`)}
          <circle
            role="presentation"
            cx={row.x}
            cy={row.y}
            r={row.hitRadius}
            fill="transparent"
            on:pointerenter={() => showTooltip(row)}
          />
        {/each}
      </g>
    {/if}
  </svg>

  {#if tooltip}
    <div class:align-right={tooltip.alignRight} class="chart-tooltip" style={`left:${tooltip.x}px;top:${tooltip.y}px;`}>
      <div class="font-extrabold">{tooltip.title}</div>
      {#each tooltip.meta as line}
        <div>{line}</div>
      {/each}
      <div class="mt-2 grid gap-1">
        {#each tooltip.rows as row}
          <div class="tooltip-result">
            <span class="dot" style={`background:${row.colorHex}`}></span>
            <span>{row.shortName}</span>
            <strong>{formatPercent(row.voteShare, 1)}</strong>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if fullEndDay > fullStartDay}
    <div
      class="navigator"
      style={`--from:${((activeStartDay - fullStartDay) / Math.max(1, fullEndDay - fullStartDay)) * 100}%;--to:${((activeEndDay - fullStartDay) / Math.max(1, fullEndDay - fullStartDay)) * 100}%`}
    >
      <div class="navigator-row">
        <span>Zoom temporal</span>
        <span>{formatShortDate(dayToDate(activeStartDay))} - {formatShortDate(dayToDate(activeEndDay))}</span>
      </div>
      <div class="brush">
        <div class="brush-track"></div>
        <div class="brush-selection"></div>
        <input
          aria-label="Inicio del zoom temporal"
          type="range"
          min={fullStartDay}
          max={fullEndDay}
          value={activeStartDay}
          on:input={(event) => updateZoomStart((event.currentTarget as HTMLInputElement).value)}
        />
        <input
          aria-label="Fin del zoom temporal"
          type="range"
          min={fullStartDay}
          max={fullEndDay}
          value={activeEndDay}
          on:input={(event) => updateZoomEnd((event.currentTarget as HTMLInputElement).value)}
        />
      </div>
      <button type="button" on:click={resetZoom}>Restablecer zoom</button>
    </div>
  {/if}
</div>

<style>
  .chart-shell {
    position: relative;
  }

  .average-summary {
    display: grid;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .average-summary-header {
    align-items: baseline;
    color: var(--color-text-secondary);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.82rem;
    font-weight: 800;
    gap: 0.35rem 0.6rem;
    justify-content: space-between;
  }

  .average-summary-header strong {
    color: var(--color-text);
  }

  .average-card-grid {
    display: grid;
    gap: 0.65rem;
    grid-template-columns: repeat(auto-fit, minmax(8.75rem, 1fr));
  }

  .average-card {
    border: 1px solid var(--color-border);
    border-left: 0.28rem solid var(--party-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    display: grid;
    gap: 0.35rem;
    min-height: 6.4rem;
    padding: 0.75rem 0.8rem;
  }

  .average-card-topline {
    align-items: center;
    color: var(--color-text);
    display: flex;
    font-size: 0.82rem;
    font-weight: 900;
    gap: 0.42rem;
    min-width: 0;
  }

  .average-swatch {
    background: var(--party-color);
    border-radius: 999px;
    flex: 0 0 auto;
    height: 0.55rem;
    width: 0.55rem;
  }

  .average-card strong {
    color: var(--party-color);
    font-size: clamp(1.45rem, 2.6vw, 2rem);
    font-weight: 900;
    line-height: 1;
  }

  .average-card span:last-child {
    color: var(--color-text-secondary);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .trend-chart {
    display: block;
    min-height: 24rem;
    overflow: visible;
    width: 100%;
  }

  .grid line {
    stroke: var(--color-border-light);
    stroke-width: 1;
  }

  .axes line {
    stroke: var(--color-text);
    stroke-width: 1;
  }

  .axes text {
    fill: var(--color-text);
    font-family: var(--font-sans);
    font-size: 13px;
  }

  .average-line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-opacity: 0.92;
    stroke-width: 2.8;
  }

  .hit-layer circle {
    cursor: pointer;
    pointer-events: all;
  }

  .chart-tooltip {
    position: absolute;
    z-index: 20;
    max-width: min(300px, calc(100% - 24px));
    min-width: 210px;
    transform: translate(12px, -50%);
    pointer-events: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: var(--shadow-md);
    color: var(--color-text);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    padding: 0.55rem 0.65rem;
  }

  .chart-tooltip.align-right {
    transform: translate(calc(-100% - 12px), -50%);
  }

  .navigator {
    border-top: 1px solid var(--color-border-light);
    display: grid;
    gap: 0.35rem;
    margin-top: 0.65rem;
    padding-top: 0.65rem;
  }

  .navigator-row {
    color: var(--color-text-secondary);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.78rem;
    font-weight: 700;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .brush {
    height: 2rem;
    position: relative;
  }

  .brush-track,
  .brush-selection {
    border-radius: 999px;
    height: 0.3rem;
    left: 0;
    position: absolute;
    right: 0;
    top: 0.85rem;
  }

  .brush-track {
    background: var(--color-border);
  }

  .brush-selection {
    background: var(--color-accent);
    left: var(--from);
    right: calc(100% - var(--to));
  }

  .brush input[type='range'] {
    appearance: none;
    background: transparent;
    height: 2rem;
    inset: 0;
    margin: 0;
    pointer-events: none;
    position: absolute;
    width: 100%;
  }

  .brush input[type='range']::-webkit-slider-thumb {
    appearance: none;
    background: #ffffff;
    border: 2px solid var(--color-accent);
    border-radius: 999px;
    box-shadow: var(--shadow-sm);
    cursor: ew-resize;
    height: 1rem;
    pointer-events: auto;
    width: 1rem;
  }

  .brush input[type='range']::-moz-range-thumb {
    background: #ffffff;
    border: 2px solid var(--color-accent);
    border-radius: 999px;
    box-shadow: var(--shadow-sm);
    cursor: ew-resize;
    height: 1rem;
    pointer-events: auto;
    width: 1rem;
  }

  .navigator button {
    color: var(--color-accent);
    font-size: 0.75rem;
    font-weight: 800;
    justify-self: start;
  }

  .tooltip-result {
    align-items: center;
    display: grid;
    gap: 0.45rem;
    grid-template-columns: auto 1fr auto;
  }

  .dot {
    border-radius: 999px;
    height: 0.55rem;
    width: 0.55rem;
  }
</style>
