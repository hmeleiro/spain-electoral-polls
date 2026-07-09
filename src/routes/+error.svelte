<script lang="ts">
  import { page } from '$app/stores';
  import { NAV_ITEMS } from '$lib/config/navigation';

  const statusCopy: Record<number, { eyebrow: string; title: string; message: string }> = {
    404: {
      eyebrow: 'Error 404',
      title: 'Pagina no encontrada',
      message:
        'La ruta que has abierto no existe o ha cambiado de ubicacion. Puedes volver al inicio o entrar en una de las secciones principales.'
    }
  };

  $: status = $page.status;
  $: content =
    statusCopy[status] ?? {
      eyebrow: `Error ${status}`,
      title: 'Algo no ha ido bien',
      message:
        $page.error?.message ??
        'No se pudo cargar esta pagina. Prueba a volver al inicio o a navegar desde una seccion principal.'
    };
</script>

<svelte:head>
  <title>{status === 404 ? 'Pagina no encontrada' : 'Error'} - Spain Electoral Polls</title>
  {#if status === 404}
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>

<section class="not-found-shell">
  <div class="editorial-shell">
    <div class="not-found-layout">
      <div class="not-found-copy">
        <p class="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p class="lead">{content.message}</p>

        <div class="actions" aria-label="Acciones principales">
          <a class="primary-action" href="/">Volver al inicio</a>
          <a class="secondary-action" href="/encuestas">Ver encuestas</a>
        </div>
      </div>

      <aside class="panel navigation-panel" aria-label="Secciones disponibles">
        <p class="panel-title">Secciones disponibles</p>
        <nav>
          {#each NAV_ITEMS as item}
            <a href={item.href}>{item.label}</a>
          {/each}
        </nav>
      </aside>
    </div>
  </div>
</section>

<style>
  .not-found-shell {
    background:
      linear-gradient(180deg, var(--color-surface) 0%, rgba(255, 255, 255, 0) 58%),
      var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    min-height: 28rem;
    padding: 5rem 0 4rem;
  }

  .not-found-layout {
    align-items: center;
    display: grid;
    gap: 2rem;
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 22rem);
  }

  .not-found-copy {
    max-width: 43rem;
  }

  h1 {
    color: var(--color-text);
    font-size: clamp(2.25rem, 6vw, 4.25rem);
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1.05;
    margin: 0.85rem 0 0;
  }

  .lead {
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    line-height: 1.8;
    margin: 1.25rem 0 0;
    max-width: 38rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .primary-action,
  .secondary-action {
    align-items: center;
    border-radius: var(--radius-sm);
    display: inline-flex;
    font-size: 0.95rem;
    font-weight: 800;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.65rem 1rem;
    text-decoration: none;
    transition: all var(--transition);
  }

  .primary-action {
    background: var(--color-accent);
    color: #ffffff;
  }

  .primary-action:hover {
    background: var(--color-accent-hover);
  }

  .secondary-action {
    border: 1px solid var(--color-border);
    color: var(--color-accent);
  }

  .secondary-action:hover {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
  }

  .navigation-panel {
    padding: 1.25rem;
  }

  .panel-title {
    color: var(--color-text);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .navigation-panel nav {
    display: grid;
    gap: 0.35rem;
  }

  .navigation-panel a {
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    font-weight: 700;
    padding: 0.55rem 0.65rem;
    text-decoration: none;
    transition: all var(--transition);
  }

  .navigation-panel a:hover {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  @media (max-width: 48rem) {
    .not-found-shell {
      padding: 3.5rem 0 3rem;
    }

    .not-found-layout {
      grid-template-columns: 1fr;
    }

    .actions a {
      width: 100%;
    }
  }
</style>
