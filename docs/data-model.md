# Modelo de Datos

Fuente base por defecto:

```text
https://data.spainelectoralproject.com/spain-electoral-polls/latest
```

## `manifest.json`

Metadatos del dataset. La app lo carga primero y usa `average_election_key`, `parties`, `latest_fieldwork_end`, `generated_at`, `project_version`, `row_counts` y `validation_status`.

## `validation_report.json`

Informe con forma real:

```text
generated_at
status
checks: { [check_name]: { status, severity, message } }
```

Si `status` no es `passed`, la app muestra una advertencia discreta. No bloquea salvo que falten datos esenciales.

## `polls.parquet`

Una fila por encuesta:

```text
poll_id, election_key, pollster_key, pollster_name, media,
fieldwork_start, fieldwork_end, publication_date,
sample_size, sample_size_imputed, source_url, source_title
```

En el dataset verificado, `fieldwork_start`, `publication_date`, `source_url` y `source_title` pueden estar ausentes para todas las filas; la interfaz muestra textos seguros.

## `poll_results.parquet`

Una fila por encuesta y partido:

```text
poll_id, election_key, pollster_key, pollster_name, media,
fieldwork_start, fieldwork_end, publication_date, date,
sample_size, sample_size_imputed,
party_key, party_name, short_name, color_hex, vote_share
```

`vote_share` esta en puntos porcentuales, no en proporcion 0-1.

## `poll_average_daily.parquet`

Promedio agregado diario:

```text
election_key, party_key, date, average_vote_share, n_polls_day
```

## `poll_deviations.parquet`

Resultados de encuesta enriquecidos con promedio de la misma fecha:

```text
poll_results columns +
average_vote_share, deviation_from_average
```

## `house_effects.parquet`

Sesgos de encuestadora por encuestadora y partido:

```text
pollster_key, party_key, house_effect, se, ic_low, ic_high, n, house_effect_status
```

El artefacto real no incluye `election_key`. La interfaz de datos acepta un parametro futuro `electionKey`, pero lo ignora mientras la columna no exista.

## Fecha Principal de Encuesta

La app usa:

1. `fieldwork_end`
2. `publication_date`
3. `date`

No inventa fechas cuando ninguna esta disponible.
