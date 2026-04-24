import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getLeaves, getGuests, getMaintenance } from '../api/requests';
import type { LeaveRequest, GuestRequest, MaintenanceRequest } from '../types';

/**
 * Hook to fetch leave requests for the authenticated student
 * Implements basic caching with React Query
 */
export const useLeaveRequests = (): UseQueryResult<LeaveRequest[], Error> => {
  return useQuery({
    queryKey: ['leaves'],
    queryFn: getLeaves,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to fetch guest requests for the authenticated student
 * Implements basic caching with React Query
 */
export const useGuestRequests = (): UseQueryResult<GuestRequest[], Error> => {
  return useQuery({
    queryKey: ['guests'],
    queryFn: getGuests,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to fetch maintenance requests for the authenticated student
 * Implements basic caching with React Query
 */
export const useMaintenanceRequests = (): UseQueryResult<
  MaintenanceRequest[],
  Error
> => {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: getMaintenance,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
};

/**
 * Combined hook to fetch all pending requests
 * Returns all three request types for easy consumption
 */
export const useAllRequests = () => {
  const leaves = useLeaveRequests();
  const guests = useGuestRequests();
  const maintenance = useMaintenanceRequests();

  return {
    leaves,
    guests,
    maintenance,
    isLoading: leaves.isLoading || guests.isLoading || maintenance.isLoading,
    isError: leaves.isError || guests.isError || maintenance.isError,
    error: leaves.error || guests.error || maintenance.error,
  };
};
