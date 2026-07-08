import { env } from '$env/dynamic/public';

export const DEFAULT_DATA_BASE_URL = 'https://data.spainelectoralproject.com/poll-of-polls/latest';

function stripSlashes(value: string): string {
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

export function getDataBaseUrl(): string {
  return (env.PUBLIC_DATA_BASE_URL?.trim() || DEFAULT_DATA_BASE_URL).replace(/\/+$/, '');
}

export function dataFileUrl(fileName: string): string {
  return `${getDataBaseUrl()}/${stripSlashes(fileName)}`;
}
