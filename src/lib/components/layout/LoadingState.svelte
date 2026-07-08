<script lang="ts">
  export let label = 'Cargando datos';
</script>

<div class="panel flex min-h-36 items-center justify-center p-8 text-center text-sm text-[var(--color-text-secondary)]">
  <div>
    <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"></div>
    <p>{label}</p>
  </div>
</div>
