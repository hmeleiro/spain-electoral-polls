<script lang="ts">
  import PollTrendChart from '$lib/components/charts/PollTrendChart.svelte';
  import type { PollAveragePoint } from '$lib/data/schema';

  export let averages: PollAveragePoint[] = [];
</script>

<PollTrendChart {averages} polls={[]} showPolls={false} />
