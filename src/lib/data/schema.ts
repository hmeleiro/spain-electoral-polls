import type { PartyConfig } from '$lib/config/parties';

export type Manifest = {
  schemaVersion: string;
  projectVersion: string;
  generatedAt: string;
  runId: string;
  source: string;
  averageElectionKey: string;
  houseEffectElectionKeys: string[];
  parties: string[];
  latestFieldworkEnd: string;
  rowCounts: Record<string, number>;
  validationStatus: string;
};

export type ValidationCheck = {
  status: string;
  severity: string;
  message: string;
};

export type ValidationReport = {
  generatedAt: string;
  status: string;
  checks: Record<string, ValidationCheck>;
};

export type Poll = {
  pollId: string;
  electionKey: string;
  pollsterKey: string;
  pollsterName: string;
  media: string | null;
  fieldworkStart: string | null;
  fieldworkEnd: string | null;
  publicationDate: string | null;
  date: string | null;
  sampleSize: number | null;
  sampleSizeImputed: boolean;
  sourceUrl: string | null;
  sourceTitle: string | null;
};

export type PollResult = Poll & {
  partyKey: string;
  partyName: string;
  shortName: string;
  colorHex: string;
  voteShare: number | null;
};

export type PollDeviation = PollResult & {
  averageVoteShare: number | null;
  deviationFromAverage: number | null;
};

export type PollAveragePoint = {
  electionKey: string;
  partyKey: string;
  date: string;
  averageVoteShare: number | null;
  nPollsDay: number | null;
  party: PartyConfig;
};

export type HouseEffect = {
  pollsterKey: string;
  partyKey: string;
  houseEffect: number | null;
  se: number | null;
  icLow: number | null;
  icHigh: number | null;
  n: number | null;
  houseEffectStatus: string;
  party: PartyConfig;
  pollsterName?: string;
};

export type PollFilters = {
  electionKey?: string;
  pollsterKeys?: string[];
  partyKeys?: string[];
  media?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PollsterSummary = {
  pollsterKey: string;
  pollsterName: string;
  nPolls: number;
  firstPollDate: string | null;
  lastPollDate: string | null;
  media: string[];
  parties: PartyConfig[];
};

export type PollDetail = {
  poll: Poll;
  results: PollResult[];
  deviations: PollDeviation[];
};

export type PollTrendSeries = {
  averages: PollAveragePoint[];
  polls: PollResult[];
};

export type PollsterTrendSeries = PollTrendSeries & {
  pollster: PollsterSummary;
  deviations: PollDeviation[];
};

export type RawPoll = {
  poll_id: string;
  election_key: string;
  pollster_key: string;
  pollster_name: string;
  media: string | null;
  fieldwork_start: unknown;
  fieldwork_end: unknown;
  publication_date: unknown;
  date?: unknown;
  sample_size: number | null;
  sample_size_imputed: boolean | null;
  source_url: string | null;
  source_title: string | null;
};

export type RawPollResult = RawPoll & {
  party_key: string;
  party_name: string;
  short_name: string;
  color_hex: string | null;
  vote_share: number | null;
};

export type RawPollDeviation = RawPollResult & {
  average_vote_share: number | null;
  deviation_from_average: number | null;
};

export type RawPollAveragePoint = {
  election_key: string;
  party_key: string;
  date: unknown;
  average_vote_share: number | null;
  n_polls_day: number | null;
};

export type RawHouseEffect = {
  pollster_key: string;
  party_key: string;
  house_effect: number | null;
  se: number | null;
  ic_low: number | null;
  ic_high: number | null;
  n: number | null;
  house_effect_status: string;
};
