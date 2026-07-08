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
      Esta pagina recoge notas metodologicas pendientes de validacion. No introduce supuestos no presentes en los datos.
    </p>
  </div>

  <div class="mt-10 grid gap-5 md:grid-cols-2">
    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Origen de las encuestas</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Pendiente de validacion metodologica: las encuestas proceden del dataset publicado por Spain Electoral Project
        a partir de fuentes recopiladas en el pipeline de datos.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Promedio agregado</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Pendiente de validacion metodologica: el artefacto `poll_average_daily.parquet` contiene la estimacion diaria
        agregada por partido. Esta web solo visualiza ese resultado.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">Comparacion con el promedio</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Cada resultado de encuesta puede compararse con el promedio agregado estimado para la fecha normalizada de
        esa encuesta.
      </p>
    </section>

    <section class="panel p-5">
      <h2 class="text-xl font-semibold text-[var(--color-text)]">House effects e intervalos</h2>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        Un house effect mide desviaciones sistematicas respecto al conjunto de encuestas. Los intervalos expresan la
        incertidumbre del artefacto publicado y no deben interpretarse como evidencia de intencionalidad.
      </p>
    </section>
  </div>
</section>
