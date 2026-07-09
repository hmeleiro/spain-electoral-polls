# Arquitectura

## Capas

La capa visual no conoce Parquet ni SQL. Las rutas llaman funciones de dominio en `src/lib/data/queries.ts` y reciben datos normalizados.

```text
Componentes Svelte
  -> queries.ts
    -> duckdb.ts
      -> Parquet remoto
    -> transforms.ts
      -> tipos internos
```

## DuckDB-WASM

`duckdb.ts` mantiene un singleton de base de datos y cachea el registro de cada fichero Parquet. Las consultas registran solo los ficheros mencionados en el SQL.

## Configuracion

`PUBLIC_DATA_BASE_URL` define la raiz de datos. El valor por defecto apunta a `spain-electoral-polls/latest`, pero puede cambiar a otro prefijo sin tocar componentes.

## Estados de Datos

- `manifest.json` se considera esencial.
- `validation_report.json` informa advertencias, no bloquea si el dataset esencial carga.
- Los nulos se normalizan antes de llegar a la UI.

## Migracion Futura

Si los datos pasan a REST, Arrow remoto, DuckDB remoto o JSON preagregado, la migracion deberia limitarse a `src/lib/data`. Los componentes deben seguir recibiendo los mismos tipos internos.
