<script lang="ts">
  import PollTrendChart from '$lib/components/charts/PollTrendChart.svelte';
  import type { PollResult } from '$lib/data/schema';

  export let polls: PollResult[] = [];
</script>

<PollTrendChart averages={[]} {polls} showAverage={false} />
