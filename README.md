# Spain Electoral Poll of Polls Web

Visualizador web de encuestas electorales espanolas, promedio agregado diario y sesgos de encuestadora.

## Stack

- SvelteKit + TypeScript
- Tailwind CSS 4
- DuckDB-WASM para consultar Parquet en cliente
- Observable Plot para graficos
- Vitest para transformaciones y parsing

## Desarrollo

```bash
npm install
npm run dev
```

Comprobaciones:

```bash
npm run check
npm run test
npm run build
```

## Datos

La app no usa API inicial. Lee artefactos estaticos publicados en Cloudflare/R2 desde:

```text
PUBLIC_DATA_BASE_URL=https://data.spainelectoralproject.com/spain-electoral-polls/latest
```

Archivos esperados:

- `manifest.json`
- `validation_report.json`
- `polls.parquet`
- `poll_results.parquet`
- `poll_deviations.parquet`
- `poll_average_daily.parquet`
- `house_effects.parquet`

La URL base vive en `src/lib/config/data.ts`; los componentes visuales no construyen URLs ni consultan Parquet directamente.

## Estructura

```text
src/lib/config      Configuracion publica, partidos y navegacion
src/lib/data        DuckDB-WASM, SQL, tipos, parsing y transformaciones
src/lib/components  Layout, estados, filtros, tablas y graficos
src/lib/utils       Fechas, formato, estadistica sencilla y URLs
src/routes          Home, encuestas, encuestadoras, sesgos de encuestadora y metodologia
docs                Modelo de datos y arquitectura
```

## Build estatico

El proyecto usa `@sveltejs/adapter-static` con fallback `200.html` y `ssr = false`, de modo que las rutas dinamicas se resuelven como SPA sobre artefactos estaticos.
