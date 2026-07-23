import { env } from '$env/dynamic/public';

export const DEFAULT_DATA_BASE_URL = 'https://data.spainelectoralproject.com/spain-electoral-polls/latest';

let dataVersion = '';

function stripSlashes(value: string): string {
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

function versionedUrl(url: string): string {
  if (!dataVersion) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(dataVersion)}`;
}

export function getDataBaseUrl(): string {
  return (env.PUBLIC_DATA_BASE_URL?.trim() || DEFAULT_DATA_BASE_URL).replace(/\/+$/, '');
}

export function getDataVersion(): string {
  return dataVersion;
}

export function dataVersionFromManifest(manifest: {
  runId?: string;
  generatedAt?: string;
  projectVersion?: string;
}): string {
  return manifest.runId || manifest.generatedAt || manifest.projectVersion || '';
}

export function setDataVersion(version: string): void {
  dataVersion = version.trim();
}

export function dataFileUrl(fileName: string, options: { cacheBust?: boolean } = {}): string {
  const url = `${getDataBaseUrl()}/${stripSlashes(fileName)}`;
  return options.cacheBust === false ? url : versionedUrl(url);
}
