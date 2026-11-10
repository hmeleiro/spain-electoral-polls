import { describe, expect, it } from 'vitest';
import { DEFAULT_DATA_BASE_URL, dataFileUrl, setDataVersion } from '$lib/config/data';
import { getPartyConfig } from '$lib/config/parties';
import { parseManifest } from '$lib/data/manifest';
import { parseValidationReport } from '$lib/data/validation';
import type { RawPoll, RawPollResult } from '$lib/data/schema';
import {
  buildPollDetail,
  buildPollsterSummaries,
  buildTrendSeries,
  filterPollResults,
  harmonizeAveragePoints,
  harmonizePollDeviations,
  harmonizePollResults,
  normalizeAveragePoint,
  normalizePoll,
  normalizePollDeviation,
  normalizePollResult
} from '$lib/data/transforms';
import { dateToString, primaryPollDate } from '$lib/utils/dates';

const rawPoll: RawPoll = {
  poll_id: '944',
  election_key: 'congreso_espana_2027',
  pollster_key: 'sociometrica',
  pollster_name: 'SocioMetrica',
  media: null,
  fieldwork_start: null,
  fieldwork_end: '2026-07-04',
  publication_date: null,
  sample_size: null,
  sample_size_imputed: true,
  source_url: null,
  source_title: null
};

const rawResult: RawPollResult = {
  ...rawPoll,
  date: '2026-07-04',
  party_key: 'pp',
  party_name: 'Partido Popular',
  short_name: 'PP',
  color_hex: '#1d84ce',
  vote_share: 33.2
};

describe('manifest parsing', () => {
  it('maps snake_case manifest fields into internal metadata', () => {
    const manifest = parseManifest({
      schema_version: '1.0.0',
      project_version: '0.1.0',
      generated_at: '2026-07-07T15:42:44Z',
      run_id: '20260707T154211Z',
      source: 'spainpolls',
      average_election_key: 'congreso_espana_2027',
      house_effect_election_keys: ['congreso_espana_2027'],
      parties: ['psoe', 'pp'],
      latest_fieldwork_end: '2026-07-04',
      row_counts: { polls: 508 },
      validation_status: 'passed'
    });

    expect(manifest.averageElectionKey).toBe('congreso_espana_2027');
    expect(manifest.rowCounts.polls).toBe(508);
    expect(manifest.validationStatus).toBe('passed');
  });

  it('loads validation checks from the real report shape', () => {
    const report = parseValidationReport({
      generated_at: '2026-07-07T15:42:44Z',
      status: 'passed',
      checks: {
        polls_columns: { status: 'pass', severity: 'error', message: 'ok' }
      }
    });

    expect(report.status).toBe('passed');
    expect(report.checks.polls_columns.message).toBe('ok');
  });
});

describe('data file URLs', () => {
  it('versiona los ficheros de datos sin versionar el manifest inicial', () => {
    setDataVersion('20260723T132600Z');

    expect(dataFileUrl('polls.parquet')).toBe(`${DEFAULT_DATA_BASE_URL}/polls.parquet?v=20260723T132600Z`);
    expect(dataFileUrl('manifest.json', { cacheBust: false })).toBe(`${DEFAULT_DATA_BASE_URL}/manifest.json`);

    setDataVersion('');
  });
});

describe('date normalization', () => {
  it('normalizes dates and chooses fieldwork_end first', () => {
    expect(dateToString('2026-07-04T00:00:00Z')).toBe('2026-07-04');
    expect(primaryPollDate({ fieldworkEnd: '2026-07-04', publicationDate: '2026-07-05' })).toBe('2026-07-04');
    expect(primaryPollDate({ publicationDate: '2026-07-05', date: '2026-07-03' })).toBe('2026-07-05');
  });
});

describe('poll transforms', () => {
  it('keeps Frente Amplio visually separate from Sumar', () => {
    const sumar = getPartyConfig('sumar');
    const frenteAmplio = getPartyConfig('frente_amplio');

    expect(frenteAmplio.label).toBe('Frente Amplio');
    expect(frenteAmplio.key).not.toBe(sumar.key);
    expect(frenteAmplio.color).not.toBe(sumar.color);
  });

  it('handles null values without leaking undefined/null strings', () => {
    const poll = normalizePoll(rawPoll);

    expect(poll.media).toBeNull();
    expect(poll.sampleSize).toBeNull();
    expect(poll.sampleSizeImputed).toBe(true);
    expect(poll.date).toBe('2026-07-04');
  });

  it('uses color_hex and dynamic party config from poll results', () => {
    const result = normalizePollResult(rawResult);

    expect(result.partyKey).toBe('pp');
    expect(result.colorHex).toBe('#1d84ce');
    expect(result.voteShare).toBe(33.2);
    expect(getPartyConfig('pp', { color: result.colorHex }).color).toBe('#1d84ce');
  });

  it('builds poll detail with results sorted by vote share', () => {
    const poll = normalizePoll(rawPoll);
    const pp = normalizePollResult(rawResult);
    const psoe = normalizePollResult({ ...rawResult, party_key: 'psoe', short_name: 'PSOE', vote_share: 29.1 });

    const detail = buildPollDetail(poll, [psoe, pp], []);

    expect(detail.results[0].partyKey).toBe('pp');
  });

  it('sums separate FA and FV estimates into one harmonized result', () => {
    const fa = normalizePollResult({
      ...rawResult,
      party_key: 'fa',
      party_name: 'Frente Amplio',
      short_name: 'FA',
      vote_share: 4.2
    });
    const fv = normalizePollResult({
      ...rawResult,
      party_key: 'fv',
      party_name: 'Front Valencià',
      short_name: 'FV',
      vote_share: 1.3
    });

    const results = harmonizePollResults([fa, fv]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      partyKey: 'fa_fv',
      partyName: 'Frente Amplio–Front Valencià',
      shortName: 'FA–FV',
      voteShare: 5.5,
      aggregatedFromPartyKeys: ['fa', 'fv']
    });
  });

  it('prefers a published joint FA-FV estimate without marking it as a sum', () => {
    const joint = normalizePollResult({
      ...rawResult,
      party_key: 'fa_fv',
      party_name: 'Nombre variable de origen',
      short_name: 'FA+FV',
      vote_share: 6.1
    });
    const fa = normalizePollResult({ ...rawResult, party_key: 'fa', vote_share: 4.2 });
    const fv = normalizePollResult({ ...rawResult, party_key: 'fv', vote_share: 1.3 });

    const results = harmonizePollResults([fa, joint, fv]);

    expect(results).toHaveLength(1);
    expect(results[0].voteShare).toBe(6.1);
    expect(results[0].shortName).toBe('FA–FV');
    expect(results[0].aggregatedFromPartyKeys).toBeUndefined();
  });

  it('keeps a single legacy component visible under the harmonized key without marking it as a sum', () => {
    const fa = normalizePollResult({ ...rawResult, party_key: 'fa', vote_share: 4.2 });

    const result = harmonizePollResults([fa])[0];

    expect(result.partyKey).toBe('fa_fv');
    expect(result.shortName).toBe('FA–FV');
    expect(result.voteShare).toBe(4.2);
    expect(result.aggregatedFromPartyKeys).toBeUndefined();
  });

  it('harmonizes deviations and daily averages using the component sums', () => {
    const faDeviation = normalizePollDeviation({
      ...rawResult,
      party_key: 'fa',
      party_name: 'Frente Amplio',
      short_name: 'FA',
      vote_share: 4.2,
      average_vote_share: 3.9,
      deviation_from_average: 0.3
    });
    const fvDeviation = normalizePollDeviation({
      ...rawResult,
      party_key: 'fv',
      party_name: 'Front Valencià',
      short_name: 'FV',
      vote_share: 1.3,
      average_vote_share: 1.1,
      deviation_from_average: 0.2
    });
    const averages = harmonizeAveragePoints([
      normalizeAveragePoint({
        election_key: rawPoll.election_key,
        party_key: 'fa',
        date: '2026-07-04',
        average_vote_share: 3.9,
        n_polls_day: 2
      }),
      normalizeAveragePoint({
        election_key: rawPoll.election_key,
        party_key: 'fv',
        date: '2026-07-04',
        average_vote_share: 1.1,
        n_polls_day: 2
      })
    ]);

    expect(harmonizePollDeviations([faDeviation, fvDeviation])[0]).toMatchObject({
      partyKey: 'fa_fv',
      voteShare: 5.5,
      averageVoteShare: 5,
      deviationFromAverage: 0.5
    });
    expect(averages[0]).toMatchObject({
      partyKey: 'fa_fv',
      averageVoteShare: 5,
      nPollsDay: 2
    });
  });
});

describe('filters and series', () => {
  it('filters by pollster and party', () => {
    const pp = normalizePollResult(rawResult);
    const vox = normalizePollResult({ ...rawResult, pollster_key: 'cis', party_key: 'vox', short_name: 'Vox' });

    expect(filterPollResults([pp, vox], { pollsterKeys: ['sociometrica'], partyKeys: ['pp'] })).toEqual([pp]);
  });

  it('builds pollster summaries and chart series', () => {
    const poll = normalizePoll(rawPoll);
    const result = normalizePollResult(rawResult);
    const average = normalizeAveragePoint({
      election_key: 'congreso_espana_2027',
      party_key: 'pp',
      date: '2026-07-04',
      average_vote_share: 32.4,
      n_polls_day: 1
    });

    const summaries = buildPollsterSummaries([poll], [result]);
    const series = buildTrendSeries([average], [result]);

    expect(summaries[0].pollsterKey).toBe('sociometrica');
    expect(summaries[0].parties[0].key).toBe('pp');
    expect(series.averages[0].averageVoteShare).toBe(32.4);
  });
});
