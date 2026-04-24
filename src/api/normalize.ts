// Normalize API list payloads returned in different backend shapes.
// Supports plain arrays, DRF pagination ({ results: [] }), and keyed containers.
export function normalizeListResponse<T>(
  payload: unknown,
  ...keys: string[]
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.results)) {
      return record.results as T[];
    }

    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}
