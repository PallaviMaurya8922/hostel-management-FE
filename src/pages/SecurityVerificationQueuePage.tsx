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
import {
  getApprovedGuestQrs,
  type ApprovedGuestQr,
} from '../api/security';
import { formatDateRange } from '../utils/dateUtils';

function formatVisitType(value?: 'normal' | 'overnight'): string {
  if (value === 'overnight') return 'Overnight';
  if (value === 'normal') return 'Normal';
  return '—';
}

const SecurityVerificationQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvedGuestSearch, setApprovedGuestSearch] = useState('');
  const [approvedGuestQrs, setApprovedGuestQrs] = useState<ApprovedGuestQr[]>([]);

  const filteredApprovedGuestQrs = useMemo(() => {
    const query = approvedGuestSearch.trim().toLowerCase();
    if (!query) return approvedGuestQrs;
    return approvedGuestQrs.filter(item => item.guest_name.toLowerCase().includes(query));
  }, [approvedGuestQrs, approvedGuestSearch]);

  const loadData = useCallback(async () => {
    const guestQrs = await getApprovedGuestQrs();
    setApprovedGuestQrs(guestQrs);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch {
        showToast('Failed to load security queue data', 'error');
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
      showToast('Security queue refreshed', 'success');
    } catch {
      showToast('Failed to refresh security queue', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const useGuestTokenForVerification = (token: string) => {
    const params = new URLSearchParams({ mode: 'guest', guestToken: token });
    navigate(`/security/dashboard?${params.toString()}`);
  };

  const copyGuestToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showToast('Guest QR token copied', 'success');
    } catch {
      showToast('Could not copy token. Please copy manually.', 'warning');
    }
  };

  return (
    <AppShell pageTitle="Approved Guest QR Tokens">
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
            <Card.Header
              title="Approved Guest QR Tokens"
              badge={
                <Badge variant="success" size="small">
                  {filteredApprovedGuestQrs.length} ready
                </Badge>
              }
            />
            <Card.Body>
              <Input
                label="Search guest name"
                value={approvedGuestSearch}
                onChange={e => setApprovedGuestSearch(e.target.value)}
                placeholder="e.g. Shiv Kumar"
              />

              <div className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
                {approvedGuestQrs.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No approved guest QR tokens available right now.</p>
                  </div>
                ) : filteredApprovedGuestQrs.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No guest found for "{approvedGuestSearch}".</p>
                  </div>
                ) : (
                  filteredApprovedGuestQrs.map(item => (
                    <div key={item.request_id} className="rounded-[22px] border border-surface-200/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.guest_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Host: {item.host_student} • Room {item.host_room}
                          </p>
                        </div>
                        <Badge variant="success" size="small">Approved</Badge>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {formatVisitType(item.visit_type)} • {formatDateRange(item.valid_from, item.valid_until)}
                      </p>
                      <p className="mt-2 break-all text-[11px] text-slate-400">QR Token: {item.qr_token}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="small" onClick={() => useGuestTokenForVerification(item.qr_token)}>
                          Use for Verify
                        </Button>
                        <Button size="small" variant="secondary" onClick={() => copyGuestToken(item.qr_token)}>
                          Copy Token
                        </Button>
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

export default SecurityVerificationQueuePage;
