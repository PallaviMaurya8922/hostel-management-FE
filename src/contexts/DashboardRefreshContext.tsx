import React, { createContext, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Dashboard Refresh Context
 * Provides functions to invalidate and refetch dashboard data after user actions
 *
 * Usage:
 * const { refreshPasses, refreshRequests, refreshAll } = useDashboardRefresh();
 *
 * After leave request submission:
 * await submitLeaveRequest(data);
 * refreshPasses(); // Refetch passes
 * refreshRequests(); // Refetch pending requests
 *
 * Requirements: 6.3, 4.9
 */

interface DashboardRefreshContextValue {
  refreshPasses: () => Promise<void>;
  refreshLeaves: () => Promise<void>;
  refreshGuests: () => Promise<void>;
  refreshMaintenance: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DashboardRefreshContext = createContext<
  DashboardRefreshContextValue | undefined
>(undefined);

export const DashboardRefreshProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();

  // Refetch passes data
  const refreshPasses = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['passes'] });
  }, [queryClient]);

  // Refetch leave requests
  const refreshLeaves = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['leaves'] });
  }, [queryClient]);

  // Refetch guest requests
  const refreshGuests = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['guests'] });
  }, [queryClient]);

  // Refetch maintenance requests
  const refreshMaintenance = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  }, [queryClient]);

  // Refetch all request types (for overview stats and pending requests)
  const refreshRequests = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leaves'] }),
      queryClient.invalidateQueries({ queryKey: ['guests'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
    ]);
  }, [queryClient]);

  // Refetch all dashboard data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['passes'] }),
      queryClient.invalidateQueries({ queryKey: ['leaves'] }),
      queryClient.invalidateQueries({ queryKey: ['guests'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
    ]);
  }, [queryClient]);

  const value: DashboardRefreshContextValue = {
    refreshPasses,
    refreshLeaves,
    refreshGuests,
    refreshMaintenance,
    refreshRequests,
    refreshAll,
  };

  return (
    <DashboardRefreshContext.Provider value={value}>
      {children}
    </DashboardRefreshContext.Provider>
  );
};

/**
 * Hook to access dashboard refresh functions
 */
export const useDashboardRefresh = (): DashboardRefreshContextValue => {
  const context = useContext(DashboardRefreshContext);
  if (!context) {
    throw new Error(
      'useDashboardRefresh must be used within DashboardRefreshProvider'
    );
  }
  return context;
};
