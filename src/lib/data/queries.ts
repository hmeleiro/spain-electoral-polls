import { dataFileUrl, dataVersionFromManifest, setDataVersion } from '$lib/config/data';
import { getPartyConfig } from '$lib/config/parties';
import { queryRows } from '$lib/data/duckdb';
import { parseManifest } from '$lib/data/manifest';
import type {
  HouseEffect,
  Manifest,
  Poll,
  PollAveragePoint,
  PollDeviation,
  PollDetail,
  PollFilters,
  PollResult,
  PollsterSummary,
  PollsterTrendSeries,
  PollTrendSeries,
  RawHouseEffect,
  RawPoll,
  RawPollAveragePoint,
  RawPollDeviation,
  RawPollResult,
  ValidationReport
} from '$lib/data/schema';
import {
  buildPollDetail,
  buildPollsterSummaries,
  buildTrendSeries,
  normalizeAveragePoint,
  normalizeHouseEffect,
  normalizePoll,
  normalizePollDeviation,
  normalizePollResult,
  SOURCE_FILES
} from '$lib/data/transforms';
import { parseValidationReport } from '$lib/data/validation';

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, loader());
  return cache.get(key) as Promise<T>;
}

export async function loadManifest(): Promise<Manifest> {
  return cached('manifest', async () => {
    const response = await fetch(dataFileUrl('manifest.json', { cacheBust: false }), { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo cargar manifest.json (${response.status})`);
    const manifest = parseManifest(await response.json());
    setDataVersion(dataVersionFromManifest(manifest));
    return manifest;
  });
}

export async function loadValidationReport(): Promise<ValidationReport> {
  return cached('validation-report', async () => {
    const response = await fetch(dataFileUrl('validation_report.json'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo cargar validation_report.json (${response.status})`);
    return parseValidationReport(await response.json());
  });
}

export async function getAvailableElections(): Promise<string[]> {
  return cached('available-elections', async () => {
    const rows = await queryRows<{ election_key: string }>(
      `select distinct election_key from '${SOURCE_FILES.polls}' order by election_key`
    );
    return rows.map((row) => row.election_key);
  });
}

export async function getPolls(filters: PollFilters = {}): Promise<Poll[]> {
  const where = pollWhereClause(filters);
  const rows = await queryRows<RawPoll>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       sample_size,
       sample_size_imputed,
       source_url,
       source_title
     from '${SOURCE_FILES.polls}'
     ${where}
     order by fieldwork_end desc nulls last, poll_id desc`
  );
  return rows.map(normalizePoll);
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const rows = await queryRows<RawPoll>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       sample_size,
       sample_size_imputed,
       source_url,
       source_title
     from '${SOURCE_FILES.polls}'
     where poll_id = ${sqlString(pollId)}
     limit 1`
  );
  return rows[0] ? normalizePoll(rows[0]) : null;
}

export async function getPollResults(pollId: string): Promise<PollResult[]> {
  const rows = await queryRows<RawPollResult>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       cast(date as varchar) as date,
       sample_size,
       sample_size_imputed,
       null as source_url,
       null as source_title,
       party_key,
       party_name,
       short_name,
       color_hex,
       vote_share
     from '${SOURCE_FILES.pollResults}'
     where poll_id = ${sqlString(pollId)}
     order by vote_share desc nulls last`
  );
  return rows.map(normalizePollResult);
}

export async function getPollResultsForPolls(pollIds: string[]): Promise<Map<string, PollResult[]>> {
  if (!pollIds.length) return new Map();
  const rows = await queryRows<RawPollResult>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       cast(date as varchar) as date,
       sample_size,
       sample_size_imputed,
       null as source_url,
       null as source_title,
       party_key,
       party_name,
       short_name,
       color_hex,
       vote_share
     from '${SOURCE_FILES.pollResults}'
     where poll_id in (${sqlList(pollIds)})
     order by poll_id, vote_share desc nulls last`
  );
  const grouped = new Map<string, PollResult[]>();
  for (const result of rows.map(normalizePollResult)) {
    const current = grouped.get(result.pollId) ?? [];
    current.push(result);
    grouped.set(result.pollId, current);
  }
  return grouped;
}

export async function getPollDeviations(pollId: string): Promise<PollDeviation[]> {
  const rows = await queryRows<RawPollDeviation>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       cast(date as varchar) as date,
       sample_size,
       sample_size_imputed,
       null as source_url,
       null as source_title,
       party_key,
       party_name,
       short_name,
       color_hex,
       vote_share,
       average_vote_share,
       deviation_from_average
     from '${SOURCE_FILES.pollDeviations}'
     where poll_id = ${sqlString(pollId)}
     order by vote_share desc nulls last`
  );
  return rows.map(normalizePollDeviation);
}

export async function getPollDetail(pollId: string): Promise<PollDetail | null> {
  const [poll, results, deviations] = await Promise.all([
    getPollById(pollId),
    getPollResults(pollId),
    getPollDeviations(pollId)
  ]);
  return poll ? buildPollDetail(poll, results, deviations) : null;
}

export async function getAverageSeries(
  electionKey: string,
  partyKeys: string[] = [],
  dateRange: { from?: string; to?: string } = {}
): Promise<PollAveragePoint[]> {
  const clauses = [`election_key = ${sqlString(electionKey)}`];
  if (partyKeys.length) clauses.push(`party_key in (${sqlList(partyKeys)})`);
  if (dateRange.from) clauses.push(`date >= DATE ${sqlString(dateRange.from)}`);
  if (dateRange.to) clauses.push(`date <= DATE ${sqlString(dateRange.to)}`);
  const rows = await queryRows<RawPollAveragePoint>(
    `select
       election_key,
       party_key,
       cast(date as varchar) as date,
       average_vote_share,
       n_polls_day
     from '${SOURCE_FILES.pollAverageDaily}'
     where ${clauses.join(' and ')}
     order by date, party_key`
  );
  return rows.map(normalizeAveragePoint);
}

export async function getPollSeries(
  electionKey: string,
  pollsterKeys: string[] = [],
  partyKeys: string[] = [],
  dateRange: { from?: string; to?: string } = {}
): Promise<PollResult[]> {
  const clauses = [`election_key = ${sqlString(electionKey)}`];
  if (pollsterKeys.length) clauses.push(`pollster_key in (${sqlList(pollsterKeys)})`);
  if (partyKeys.length) clauses.push(`party_key in (${sqlList(partyKeys)})`);
  if (dateRange.from) clauses.push(`date >= DATE ${sqlString(dateRange.from)}`);
  if (dateRange.to) clauses.push(`date <= DATE ${sqlString(dateRange.to)}`);
  const rows = await queryRows<RawPollResult>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       cast(date as varchar) as date,
       sample_size,
       sample_size_imputed,
       null as source_url,
       null as source_title,
       party_key,
       party_name,
       short_name,
       color_hex,
       vote_share
     from '${SOURCE_FILES.pollResults}'
     where ${clauses.join(' and ')}
     order by date, party_key, pollster_name`
  );
  return rows.map(normalizePollResult);
}

export async function getTrendSeries(
  electionKey: string,
  pollsterKeys: string[] = [],
  partyKeys: string[] = [],
  dateRange: { from?: string; to?: string } = {}
): Promise<PollTrendSeries> {
  const [averages, polls] = await Promise.all([
    getAverageSeries(electionKey, partyKeys, dateRange),
    getPollSeries(electionKey, pollsterKeys, partyKeys, dateRange)
  ]);
  return buildTrendSeries(averages, polls);
}

export async function getPollsters(electionKey?: string): Promise<PollsterSummary[]> {
  const filters = electionKey ? { electionKey } : {};
  const [polls, results] = await Promise.all([
    getPolls(filters),
    getPollSeries(electionKey ?? (await loadManifest()).averageElectionKey)
  ]);
  return buildPollsterSummaries(polls, results);
}

export async function getPollsterSummary(pollsterKey: string): Promise<PollsterSummary | null> {
  const pollsters = await getPollsters();
  return pollsters.find((pollster) => pollster.pollsterKey === pollsterKey) ?? null;
}

export async function getPollsterTrendSeries(
  pollsterKey: string,
  electionKey: string,
  partyKeys: string[] = []
): Promise<PollsterTrendSeries | null> {
  const [pollster, averages, polls, deviations] = await Promise.all([
    getPollsterSummary(pollsterKey),
    getAverageSeries(electionKey, partyKeys),
    getPollSeries(electionKey, [pollsterKey], partyKeys),
    getPollsterDeviations(pollsterKey, electionKey, partyKeys)
  ]);
  return pollster ? { pollster, averages, polls, deviations } : null;
}

export async function getPollsterDeviations(
  pollsterKey: string,
  electionKey: string,
  partyKeys: string[] = []
): Promise<PollDeviation[]> {
  const clauses = [`pollster_key = ${sqlString(pollsterKey)}`, `election_key = ${sqlString(electionKey)}`];
  if (partyKeys.length) clauses.push(`party_key in (${sqlList(partyKeys)})`);
  const rows = await queryRows<RawPollDeviation>(
    `select
       poll_id,
       election_key,
       pollster_key,
       pollster_name,
       media,
       cast(fieldwork_start as varchar) as fieldwork_start,
       cast(fieldwork_end as varchar) as fieldwork_end,
       cast(publication_date as varchar) as publication_date,
       cast(date as varchar) as date,
       sample_size,
       sample_size_imputed,
       null as source_url,
       null as source_title,
       party_key,
       party_name,
       short_name,
       color_hex,
       vote_share,
       average_vote_share,
       deviation_from_average
     from '${SOURCE_FILES.pollDeviations}'
     where ${clauses.join(' and ')}
     order by date, party_key`
  );
  return rows.map(normalizePollDeviation);
}

export async function getHouseEffects(
  pollsterKey?: string,
  partyKey?: string,
  _electionKey?: string
): Promise<HouseEffect[]> {
  const clauses = [];
  if (pollsterKey) clauses.push(`pollster_key = ${sqlString(pollsterKey)}`);
  if (partyKey) clauses.push(`party_key = ${sqlString(partyKey)}`);
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const [rows, pollsters] = await Promise.all([
    queryRows<RawHouseEffect>(
      `select
         pollster_key,
         party_key,
         house_effect,
         se,
         ic_low,
         ic_high,
         n,
         house_effect_status
       from '${SOURCE_FILES.houseEffects}'
       ${where}
       order by party_key, house_effect desc nulls last`
    ),
    getPollsters().catch(() => [])
  ]);
  const names = new Map(pollsters.map((pollster) => [pollster.pollsterKey, pollster.pollsterName]));
  return rows.map((row) => normalizeHouseEffect(row, names));
}

export async function getLatestPolls(limit = 8): Promise<Array<Poll & { results: PollResult[] }>> {
  const polls = (await getPolls()).slice(0, limit);
  const resultsByPoll = await Promise.all(polls.map((poll) => getPollResults(poll.pollId)));
  return polls.map((poll, index) => ({ ...poll, results: resultsByPoll[index] ?? [] }));
}

export async function getAvailableParties(electionKey?: string) {
  const manifest = await loadManifest();
  const rows = await getAverageSeries(electionKey ?? manifest.averageElectionKey);
  const byParty = new Map(rows.map((row) => [row.partyKey, row.party]));
  for (const partyKey of manifest.parties) {
    if (!byParty.has(partyKey)) byParty.set(partyKey, getPartyConfig(partyKey));
  }
  return [...byParty.values()];
}

export async function getAvailableMedia(): Promise<string[]> {
  const rows = await queryRows<{ media: string }>(
    `select distinct media from '${SOURCE_FILES.polls}' where media is not null order by media`
  );
  return rows.map((row) => row.media).filter(Boolean);
}

function pollWhereClause(filters: PollFilters): string {
  const clauses: string[] = [];
  if (filters.electionKey) clauses.push(`election_key = ${sqlString(filters.electionKey)}`);
  if (filters.pollsterKeys?.length) clauses.push(`pollster_key in (${sqlList(filters.pollsterKeys)})`);
  if (filters.media) clauses.push(`media = ${sqlString(filters.media)}`);
  if (filters.dateFrom) clauses.push(`fieldwork_end >= DATE ${sqlString(filters.dateFrom)}`);
  if (filters.dateTo) clauses.push(`fieldwork_end <= DATE ${sqlString(filters.dateTo)}`);
  return clauses.length ? `where ${clauses.join(' and ')}` : '';
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlList(values: string[]): string {
  return values.map(sqlString).join(', ');
}
