import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { useToast } from '../contexts';
import {
  getPassHistory,
  exportPassHistory,
  type PassHistoryFilters,
} from '../api/warden';

const WardenPassHistoryPage: React.FC = () => {
  const { showToast } = useToast();

  const [filters, setFilters] = useState<PassHistoryFilters>({
    status: 'approved',
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['warden-pass-history', filters],
    queryFn: () => getPassHistory(filters),
    staleTime: 1000 * 30,
  });

  const activeAwayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return history.filter(item => item.to_date >= today && item.status !== 'rejected')
      .length;
  }, [history]);

  const handleFilterChange = (key: keyof PassHistoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleExport = async () => {
    try {
      const blob = await exportPassHistory(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pass-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Pass history exported successfully', 'success');
    } catch {
      showToast('Failed to export pass history', 'error');
    }
  };

  return (
    <AppShell pageTitle="Pass History">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Pass History</h1>
                  <p className="text-slate-600 mt-1">
                    Students currently away and historical leave/pass records.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="medium" className="px-3 py-1 font-semibold">
                    Away Now: {activeAwayCount}
                  </Badge>
                  <Button variant="secondary" onClick={handleExport}>
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>


          <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <Input
                  label="Student Name"
                  placeholder="Search student"
                  value={filters.student_name || ''}
                  onChange={e => handleFilterChange('student_name', e.target.value)}
                />
                <Select
                  label="Status"
                  value={filters.status || ''}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                />
                <Select
                  label="Pass Type"
                  value={filters.pass_type || ''}
                  onChange={e =>
                    handleFilterChange(
                      'pass_type',
                      e.target.value as 'digital' | 'leave'
                    )
                  }
                  options={[
                    { value: '', label: 'All' },
                    { value: 'digital', label: 'Digital Pass' },
                    { value: 'leave', label: 'Leave Request' },
                  ]}
                />
                <Input
                  label="From Date"
                  type="date"
                  value={filters.start_date || ''}
                  onChange={e => handleFilterChange('start_date', e.target.value)}
                />
                <Input
                  label="To Date"
                  type="date"
                  value={filters.end_date || ''}
                  onChange={e => handleFilterChange('end_date', e.target.value)}
                />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200/80 shadow-glass-sm p-6">
              {isLoading && (
                <div className="space-y-3">
                  <Skeleton height="56px" />
                  <Skeleton height="56px" />
                  <Skeleton height="56px" />
                </div>
              )}

              {!isLoading && history.length === 0 && (
                <p className="text-slate-500 text-center py-6">No pass history records found.</p>
              )}

              {!isLoading && history.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 border-b border-surface-200">
                        <th className="py-3 pr-3">Student</th>
                        <th className="py-3 pr-3">Room</th>
                        <th className="py-3 pr-3">Pass ID</th>
                        <th className="py-3 pr-3">Duration</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3 pr-3">Approved By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(item => (
                        <tr key={`${item.pass_number}-${item.created_at}`} className="border-b border-surface-100">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-slate-900">{item.student_name}</div>
                            <div className="text-xs text-slate-500">{item.student_id}</div>
                          </td>
                          <td className="py-3 pr-3">{item.room_number}</td>
                          <td className="py-3 pr-3">
                            <div
                              className="max-w-[180px] truncate text-xs text-slate-500 font-mono"
                              title={item.pass_number}
                            >
                              {item.pass_number}
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            {item.from_date} to {item.to_date}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge
                              variant={
                                item.status === 'approved' || item.status === 'active'
                                  ? 'success'
                                  : item.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="small"
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-3 text-slate-500">{item.approved_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default WardenPassHistoryPage;
