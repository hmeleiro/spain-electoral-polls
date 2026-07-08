<script lang="ts">
  import PollTrendChart from '$lib/components/charts/PollTrendChart.svelte';
  import type { PollAveragePoint, PollResult } from '$lib/data/schema';

  export let averages: PollAveragePoint[] = [];
  export let polls: PollResult[] = [];
  export let showAverage = true;
</script>

<PollTrendChart {averages} {polls} {showAverage} />
