<svelte:head>
  <title>Metodologia · Spain Electoral Polls</title>
</svelte:head>

<section class="editorial-shell py-10 md:py-14">
  <div class="max-w-3xl">
    <p class="eyebrow">Metodologia</p>
    <h1 class="mt-3 text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
      Como leer este visualizador
    </h1>
    <p class="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
      Este visualizador reúne encuestas electorales publicadas por distintas casas demoscópicas y permite comparar sus estimaciones, seguir su evolución en el tiempo y analizar las diferencias sistemáticas entre encuestadoras.
    </p>
  </div>

  <div class="mt-10 grid gap-5 md:grid-cols-2">
    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Origen de las encuestas</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Las encuestas proceden de la base de datos de Spain Electoral Polls, construida a partir de fuentes públicas y sometida a procesos de normalización, validación y actualización.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Tendencia agregada</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        La línea de tendencia resume la evolución estimada del apoyo a cada partido combinando las encuestas disponibles y suavizando las variaciones puntuales entre estudios.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Comparación con la tendencia</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Cada estimación puede compararse con la tendencia agregada correspondiente a su fecha. La diferencia indica cuánto se sitúa una encuesta por encima o por debajo de la referencia común.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Sesgos de encuestadora</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Los sesgos de encuestadora miden si una casa demoscópica tiende a situar sistemáticamente a un partido por encima o por debajo de la tendencia general. Los intervalos reflejan la incertidumbre asociada a ese sesgo.
      </p>
    </section>
  </div>
</section>
