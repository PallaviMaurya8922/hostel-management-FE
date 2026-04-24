import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getPasses } from '../api/passes';
import type { DigitalPass } from '../types';

/**
 * Hook to fetch digital passes for the authenticated student
 * Implements basic caching with React Query
 */
export const usePasses = (): UseQueryResult<DigitalPass[], Error> => {
  return useQuery({
    queryKey: ['passes'],
    queryFn: getPasses,
    staleTime: 1000 * 60 * 2, // 2 minutes - passes change less frequently
  });
};
