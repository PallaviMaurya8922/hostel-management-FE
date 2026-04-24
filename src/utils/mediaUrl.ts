import { config } from '../config/env';

/** Resolve media paths from the API (often `/media/...`) to a full URL for `<img src>`. */
export function absoluteMediaUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = config.apiBaseUrl.replace(/\/api\/?$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
