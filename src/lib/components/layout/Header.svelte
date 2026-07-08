<script lang="ts">
  import { NAV_ITEMS } from '$lib/config/navigation';

  export let activePath = '/';
</script>

<header class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
  <div class="editorial-shell flex min-h-16 items-center justify-between gap-4 py-2">
    <a href="/" class="flex items-center gap-2 text-[var(--color-text)] no-underline">
      <span class="text-xl text-[var(--color-accent)]" aria-hidden="true">&#9670;</span>
      <div class="text-base font-bold leading-tight sm:text-lg">
        Spain Electoral Polls
      </div>
    </a>

    <nav class="flex flex-wrap justify-end gap-1 text-sm font-medium" aria-label="Navegacion principal">
      {#each NAV_ITEMS as item}
        <a class:active={item.match(activePath)} href={item.href}>{item.label}</a>
      {/each}
    </nav>
  </div>
</header>

<style>
  nav a {
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    padding: 0.45rem 0.65rem;
    text-decoration: none;
    transition: all var(--transition);
  }

  nav a.active,
  nav a:hover {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  @media (max-width: 42rem) {
    header {
      position: static;
    }

    .editorial-shell {
      align-items: flex-start;
      flex-direction: column;
    }

    nav {
      justify-content: flex-start;
    }
  }
</style>
