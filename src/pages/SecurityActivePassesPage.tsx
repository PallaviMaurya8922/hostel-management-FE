import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import AppShell from '../components/AppShell';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Skeleton from '../components/Skeleton';
import { useToast } from '../contexts';
import { getActivePasses, type ActivePass } from '../api/security';
import { formatDateRange, formatRelativeTime } from '../utils/dateUtils';

const SecurityActivePassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePasses, setActivePasses] = useState<ActivePass[]>([]);

  const filteredActivePasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activePasses;
    return activePasses.filter(pass => pass.student_name.toLowerCase().includes(query));
  }, [activePasses, searchQuery]);

  const loadData = useCallback(async () => {
    const passes = await getActivePasses();
    setActivePasses(passes);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch {
        showToast('Failed to load active passes', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [loadData, showToast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      showToast('Active passes refreshed', 'success');
    } catch {
      showToast('Failed to refresh active passes', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const usePassForVerification = (passNumber: string, token?: string) => {
    const params = new URLSearchParams({ mode: 'pass', passNumber });
    if (token) {
      params.set('passToken', token);
    }
    navigate(`/security/dashboard?${params.toString()}`);
  };

  return (
    <AppShell pageTitle="Active Passes">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <Skeleton height="620px" />
        ) : (
          <Card className="rounded-[28px]">
            <Card.Header title="Active Passes" />
            <Card.Body>
              <Input
                label="Search student name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. Puneet Kumar"
              />

              <div className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
                {activePasses.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No active passes found.</p>
                  </div>
                ) : filteredActivePasses.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No active passes found for "{searchQuery}".</p>
                  </div>
                ) : (
                  filteredActivePasses.map(pass => (
                    <div key={pass.pass_number} className="rounded-[22px] border border-surface-200/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{pass.student_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {pass.student_id} • Room {pass.room_number}
                          </p>
                        </div>
                        <Badge variant="success" size="small">Active</Badge>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">{formatDateRange(pass.from_date, pass.to_date)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {pass.days_remaining} day(s) remaining • {pass.approval_type === 'auto' ? 'Auto approval' : 'Manual approval'}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-700">{pass.reason}</p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {pass.pass_number} • Code {pass.verification_code}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => usePassForVerification(pass.pass_number, pass.verification_code)}
                        >
                          Use for Verify
                        </Button>
                        <span className="text-xs text-slate-400">Created {formatRelativeTime(pass.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default SecurityActivePassesPage;
