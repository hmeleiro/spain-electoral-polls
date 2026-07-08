import { getPartyConfig } from '$lib/config/parties';
import type { PartyConfig } from '$lib/config/parties';
import type {
  HouseEffect,
  Poll,
  PollAveragePoint,
  PollDeviation,
  PollDetail,
  PollResult,
  PollsterSummary,
  PollTrendSeries,
  RawHouseEffect,
  RawPoll,
  RawPollAveragePoint,
  RawPollDeviation,
  RawPollResult
} from '$lib/data/schema';
import { dateToString, primaryPollDate } from '$lib/utils/dates';
import { groupBy } from '$lib/utils/stats';

export const SOURCE_FILES = {
  polls: 'polls.parquet',
  pollResults: 'poll_results.parquet',
  pollDeviations: 'poll_deviations.parquet',
  pollAverageDaily: 'poll_average_daily.parquet',
  houseEffects: 'house_effects.parquet'
};

export function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePoll(row: RawPoll): Poll {
  const fieldworkEnd = dateToString(row.fieldwork_end);
  const publicationDate = dateToString(row.publication_date);
  const date = primaryPollDate({
    fieldworkEnd,
    publicationDate,
    date: dateToString(row.date)
  });

  return {
    pollId: `${row.poll_id}`,
    electionKey: `${row.election_key}`,
    pollsterKey: `${row.pollster_key}`,
    pollsterName: `${row.pollster_name}`,
    media: nullableText(row.media),
    fieldworkStart: dateToString(row.fieldwork_start),
    fieldworkEnd,
    publicationDate,
    date,
    sampleSize: numberOrNull(row.sample_size),
    sampleSizeImputed: Boolean(row.sample_size_imputed),
    sourceUrl: nullableText(row.source_url),
    sourceTitle: nullableText(row.source_title)
  };
}

export function normalizePollResult(row: RawPollResult): PollResult {
  const party = getPartyConfig(row.party_key, {
    label: row.party_name,
    shortName: row.short_name,
    color: row.color_hex ?? undefined
  });
  return {
    ...normalizePoll(row),
    partyKey: party.key,
    partyName: row.party_name || party.label,
    shortName: row.short_name || party.shortName,
    colorHex: row.color_hex || party.color,
    voteShare: numberOrNull(row.vote_share)
  };
}

export function normalizePollDeviation(row: RawPollDeviation): PollDeviation {
  return {
    ...normalizePollResult(row),
    averageVoteShare: numberOrNull(row.average_vote_share),
    deviationFromAverage: numberOrNull(row.deviation_from_average)
  };
}

export function normalizeAveragePoint(row: RawPollAveragePoint): PollAveragePoint {
  const party = getPartyConfig(row.party_key);
  return {
    electionKey: `${row.election_key}`,
    partyKey: party.key,
    date: dateToString(row.date) ?? '',
    averageVoteShare: numberOrNull(row.average_vote_share),
    nPollsDay: numberOrNull(row.n_polls_day),
    party
  };
}

export function normalizeHouseEffect(
  row: RawHouseEffect,
  pollsterNames: Map<string, string> = new Map()
): HouseEffect {
  const party = getPartyConfig(row.party_key);
  return {
    pollsterKey: `${row.pollster_key}`,
    partyKey: party.key,
    houseEffect: numberOrNull(row.house_effect),
    se: numberOrNull(row.se),
    icLow: numberOrNull(row.ic_low),
    icHigh: numberOrNull(row.ic_high),
    n: numberOrNull(row.n),
    houseEffectStatus: `${row.house_effect_status ?? 'unclear'}`,
    party,
    pollsterName: pollsterNames.get(`${row.pollster_key}`)
  };
}

export function buildPollsterSummaries(polls: Poll[], results: PollResult[] = []): PollsterSummary[] {
  const partiesByPollster = new Map<string, Map<string, PartyConfig>>();
  for (const result of results) {
    const partyMap = partiesByPollster.get(result.pollsterKey) ?? new Map<string, PartyConfig>();
    partyMap.set(result.partyKey, getPartyConfig(result.partyKey, {
      label: result.partyName,
      shortName: result.shortName,
      color: result.colorHex
    }));
    partiesByPollster.set(result.pollsterKey, partyMap);
  }

  return [...groupBy(polls, (poll) => poll.pollsterKey).entries()]
    .map(([pollsterKey, rows]) => {
      const dates = rows.map((poll) => poll.date).filter((value): value is string => Boolean(value)).sort();
      const media = [...new Set(rows.map((poll) => poll.media).filter((value): value is string => Boolean(value)))].sort();
      return {
        pollsterKey,
        pollsterName: rows[0]?.pollsterName ?? pollsterKey,
        nPolls: rows.length,
        firstPollDate: dates[0] ?? null,
        lastPollDate: dates.at(-1) ?? null,
        media,
        parties: [...(partiesByPollster.get(pollsterKey)?.values() ?? [])]
      };
    })
    .sort((a, b) => b.nPolls - a.nPolls || a.pollsterName.localeCompare(b.pollsterName));
}

export function buildPollDetail(poll: Poll, results: PollResult[], deviations: PollDeviation[]): PollDetail {
  return {
    poll,
    results: [...results].sort((a, b) => (b.voteShare ?? -1) - (a.voteShare ?? -1)),
    deviations: [...deviations].sort((a, b) => (b.voteShare ?? -1) - (a.voteShare ?? -1))
  };
}

export function buildTrendSeries(averages: PollAveragePoint[], polls: PollResult[]): PollTrendSeries {
  return {
    averages: [...averages].sort((a, b) => a.date.localeCompare(b.date) || a.partyKey.localeCompare(b.partyKey)),
    polls: [...polls].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.partyKey.localeCompare(b.partyKey))
  };
}

export function availablePartiesFromResults(results: PollResult[]): PartyConfig[] {
  const seen = new Map<string, PartyConfig>();
  for (const result of results) {
    if (!seen.has(result.partyKey)) {
      seen.set(result.partyKey, getPartyConfig(result.partyKey, {
        label: result.partyName,
        shortName: result.shortName,
        color: result.colorHex
      }));
    }
  }
  return [...seen.values()];
}

export function filterPollResults(
  rows: PollResult[],
  filters: { pollsterKeys?: string[]; partyKeys?: string[]; dateFrom?: string; dateTo?: string } = {}
): PollResult[] {
  const pollsters = new Set(filters.pollsterKeys ?? []);
  const parties = new Set(filters.partyKeys ?? []);
  return rows.filter((row) => {
    if (pollsters.size && !pollsters.has(row.pollsterKey)) return false;
    if (parties.size && !parties.has(row.partyKey)) return false;
    if (filters.dateFrom && (row.date ?? '') < filters.dateFrom) return false;
    if (filters.dateTo && (row.date ?? '') > filters.dateTo) return false;
    return true;
  });
}

function nullableText(value: unknown): string | null {
  const text = `${value ?? ''}`.trim();
  return text || null;
}
