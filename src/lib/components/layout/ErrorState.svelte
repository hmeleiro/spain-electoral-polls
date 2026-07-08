<script lang="ts">
  export let title = 'No se pudieron cargar los datos';
  export let message = 'Revisa la conexion o la configuracion de PUBLIC_DATA_BASE_URL.';
</script>

<div class="panel border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-5">
  <p class="text-sm font-bold text-[var(--color-danger)]">{title}</p>
  <p class="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
</div>
