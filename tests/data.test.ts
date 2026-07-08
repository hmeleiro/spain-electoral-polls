import { describe, expect, it } from 'vitest';
import { getPartyConfig } from '$lib/config/parties';
import { parseManifest } from '$lib/data/manifest';
import { parseValidationReport } from '$lib/data/validation';
import type { RawPoll, RawPollResult } from '$lib/data/schema';
import {
  buildPollDetail,
  buildPollsterSummaries,
  buildTrendSeries,
  filterPollResults,
  normalizeAveragePoint,
  normalizePoll,
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

describe('date normalization', () => {
  it('normalizes dates and chooses fieldwork_end first', () => {
    expect(dateToString('2026-07-04T00:00:00Z')).toBe('2026-07-04');
    expect(primaryPollDate({ fieldworkEnd: '2026-07-04', publicationDate: '2026-07-05' })).toBe('2026-07-04');
    expect(primaryPollDate({ publicationDate: '2026-07-05', date: '2026-07-03' })).toBe('2026-07-05');
  });
});

describe('poll transforms', () => {
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
