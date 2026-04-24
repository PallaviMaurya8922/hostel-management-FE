import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge, { type BadgeVariant } from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { useAuth, useToast } from '../contexts';
import { formatDateRange, formatRelativeTime } from '../utils/dateUtils';
import jsQR from 'jsqr';
import {
  getRecentVerifications,
  getSecurityStats,
  searchStudentPasses,
  verifyDigitalPass,
  verifyGuestQr,
  type RecentVerification,
  type SecurityStats,
  type StudentPassSearchResult,
  type PassVerificationResult,
  type GuestQrVerificationResult,
} from '../api/security';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  StopIcon,
  VideoCameraIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

type VerificationMode = 'pass' | 'guest';
type RecentScanFilter = 'all' | 'alerts';
type VerificationOutcome =
  | { kind: 'pass'; data: PassVerificationResult }
  | { kind: 'guest'; data: GuestQrVerificationResult }
  | null;
type ScanSource = 'camera' | 'upload';

interface ParsedQrValue {
  mode: VerificationMode;
  passNumber?: string;
  passToken?: string;
  guestQrToken?: string;
  rawValue: string;
}

interface VerifyRequestInput {
  mode: VerificationMode;
  passNumber?: string;
  passToken?: string;
  guestQrToken?: string;
}

interface BarcodeDetectorResult {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

function isPositiveStatus(value?: string): boolean {
  const normalized = (value || '').toLowerCase();
  return (
    normalized.includes('allow') ||
    normalized.includes('valid') ||
    normalized.includes('approved') ||
    normalized.includes('active')
  );
}

function isNegativeStatus(value?: string): boolean {
  const normalized = (value || '').toLowerCase();
  return (
    normalized.includes('reject') ||
    normalized.includes('expired') ||
    normalized.includes('invalid') ||
    normalized.includes('deny')
  );
}

function getStatusBadge(value: string) {
  if (isPositiveStatus(value)) return 'success' as const;
  if (isNegativeStatus(value)) return 'danger' as const;
  return 'warning' as const;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', DATE_TIME_OPTIONS);
}

function formatVisitType(value?: 'normal' | 'overnight'): string {
  if (value === 'overnight') return 'Overnight';
  if (value === 'normal') return 'Normal';
  return '—';
}

function getVerificationErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const response = 'response' in error ? (error as { response?: { data?: unknown } }).response : undefined;
    const data = response?.data;

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (record.message) return String(record.message);
      if (record.reason) return String(record.reason);
      if (record.error) return String(record.error);
    }
  }

  return 'Verification failed';
}

function getBarcodeDetectorCtor(): BarcodeDetectorConstructor | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector || null;
}

function createQrDetector(): BarcodeDetectorInstance | null {
  const BarcodeDetectorCtor = getBarcodeDetectorCtor();
  if (!BarcodeDetectorCtor) return null;

  try {
    return new BarcodeDetectorCtor({ formats: ['qr_code'] });
  } catch {
    try {
      return new BarcodeDetectorCtor();
    } catch {
      return null;
    }
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image file'));
      image.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

async function decodeQrFromUploadedFile(file: File): Promise<string | null> {
  const detector = createQrDetector();

  if (detector && typeof createImageBitmap === 'function') {
    let bitmap: ImageBitmap | null = null;

    try {
      bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      const rawValue = results[0]?.rawValue?.trim();
      if (rawValue) return rawValue;
    } finally {
      bitmap?.close();
    }
  }

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) return null;

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

  return qrCode?.data?.trim() || null;
}

function tryParseQrUrl(value: string): ParsedQrValue | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(value, window.location.origin);
    if (url.pathname.includes('/verify-pass')) {
      const passNumber = url.searchParams.get('pass_number')?.trim() || '';
      const passToken = url.searchParams.get('token')?.trim() || '';
      if (passNumber) {
        return { mode: 'pass', passNumber, passToken, rawValue: value };
      }
    }

    const guestMatch = url.pathname.match(/\/guest\/verify\/([^/?#]+)/);
    if (guestMatch?.[1]) {
      return {
        mode: 'guest',
        guestQrToken: decodeURIComponent(guestMatch[1]),
        rawValue: value,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function parseScannedQrValue(rawValue: string): ParsedQrValue | null {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as
      | {
          v?: string;
          pass_number?: string;
          token?: string;
          qr_token?: string;
        }
      | null;

    if (parsed?.v) {
      const fromUrl = tryParseQrUrl(parsed.v);
      if (fromUrl) return fromUrl;
    }

    if (parsed?.pass_number) {
      return {
        mode: 'pass',
        passNumber: parsed.pass_number.trim(),
        passToken: parsed.token?.trim() || '',
        rawValue: value,
      };
    }

    if (parsed?.qr_token) {
      return {
        mode: 'guest',
        guestQrToken: parsed.qr_token.trim(),
        rawValue: value,
      };
    }
  } catch {
    /* ignore non-JSON payloads */
  }

  const fromUrl = tryParseQrUrl(value);
  if (fromUrl) return fromUrl;

  const verifyUrlMatch = value.match(/(?:Verify\s*URL\s*:\s*)?(https?:\/\/\S+|\/api\/verify-pass\/\?\S+)/i);
  if (verifyUrlMatch?.[1]) {
    const parsedFromVerifyUrl = tryParseQrUrl(verifyUrlMatch[1].trim());
    if (parsedFromVerifyUrl) return parsedFromVerifyUrl;
  }

  const passNumberLabelMatch = value.match(/Pass\s*Number\s*:\s*([^\n\r]+)/i);
  const tokenLabelMatch = value.match(/(?:Verification\s*Code|Token)\s*:\s*([^\n\r]+)/i);
  if (passNumberLabelMatch?.[1]) {
    return {
      mode: 'pass',
      passNumber: passNumberLabelMatch[1].trim(),
      passToken: tokenLabelMatch?.[1]?.trim() || '',
      rawValue: value,
    };
  }

  if (/^(PASS|LP-|LR-)/i.test(value)) {
    return { mode: 'pass', passNumber: value, rawValue: value };
  }

  if (/^[A-Za-z0-9_-]{16,}$/.test(value)) {
    return { mode: 'guest', guestQrToken: value, rawValue: value };
  }

  return null;
}

function getRecentVerificationKey(record: RecentVerification, index: number): string {
  return `${record.student_id}-${record.pass_number}-${record.verification_time || 'none'}-${index}`;
}

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<RecentVerification[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [studentResults, setStudentResults] = useState<StudentPassSearchResult[]>([]);

  const [mode, setMode] = useState<VerificationMode>('pass');
  const [recentScanFilter, setRecentScanFilter] = useState<RecentScanFilter>('all');
  const [passNumber, setPassNumber] = useState('');
  const [passToken, setPassToken] = useState('');
  const [guestQrToken, setGuestQrToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [latestVerification, setLatestVerification] = useState<VerificationOutcome>(null);
  const [selectedRecentScanKey, setSelectedRecentScanKey] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Choose upload or camera to scan a QR code.');
  const [lastScanSource, setLastScanSource] = useState<ScanSource | null>(null);

  const filteredRecentScans = useMemo(() => {
    if (recentScanFilter === 'all') return recentVerifications;
    return recentVerifications.filter(record => !isPositiveStatus(record.status));
  }, [recentScanFilter, recentVerifications]);

  const selectedRecentScan = useMemo(
    () =>
      recentVerifications.find((record, index) => getRecentVerificationKey(record, index) === selectedRecentScanKey) ||
      null,
    [recentVerifications, selectedRecentScanKey]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: 'Active Passes',
        value: stats?.active_passes ?? 0,
        hint: 'Currently valid for gate access',
        icon: ShieldCheckIcon,
        iconWrap: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70',
      },
      {
        label: 'Students Away',
        value: stats?.students_away ?? 0,
        hint: 'Away from hostel right now',
        icon: IdentificationIcon,
        iconWrap: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70',
      },
      {
        label: 'Expired Passes',
        value: stats?.expired_passes ?? 0,
        hint: 'Require renewed approval',
        icon: XCircleIcon,
        iconWrap: 'bg-red-50 text-red-600 ring-1 ring-red-200/70',
      },
      {
        label: 'Recent Scans',
        value: recentVerifications.length,
        hint: 'Verifications in last 24 hours',
        icon: ClockIcon,
        iconWrap: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/70',
      },
    ],
    [recentVerifications.length, stats]
  );

  const resultTone = useMemo<{
    shell: string;
    banner: string;
    badge: BadgeVariant;
    title: string;
    subtitle: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }>(() => {
    if (!latestVerification && !selectedRecentScan) {
      return {
        shell: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/90',
        banner: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100',
        badge: 'info',
        title: 'Waiting For Scan',
        subtitle: 'Use the scanner desk or manual entry panel to verify a student pass or guest QR.',
        icon: QrCodeIcon,
      };
    }

    if (!latestVerification && selectedRecentScan) {
      const isApproved = isPositiveStatus(selectedRecentScan.status);
      return {
        shell: isApproved
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:border-emerald-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900'
          : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-red-50/60 dark:border-amber-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900',
        banner: isApproved
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100'
          : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100',
        badge: isApproved ? 'success' : 'warning',
        title: isApproved ? 'Last Scan Approved' : 'Last Scan Needs Attention',
        subtitle: 'Selected from recent scans so the gate desk can quickly review the latest decision.',
        icon: isApproved ? CheckCircleIcon : ExclamationTriangleIcon,
      };
    }

    if (latestVerification && latestVerification.data.valid) {
      return {
        shell: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:border-emerald-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900',
        banner: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100',
        badge: 'success',
        title: latestVerification.kind === 'guest' ? 'Guest Entry Authorized' : 'Entry Authorized',
        subtitle: 'Verification succeeded. The gate desk can use the details below immediately.',
        icon: CheckCircleIcon,
      };
    }

    return {
      shell: 'border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50/70 dark:border-red-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900',
      banner: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-100',
      badge: 'danger',
      title: 'Verification Failed',
      subtitle: 'The presented pass or token could not be approved for entry.',
      icon: ExclamationTriangleIcon,
    };
  }, [latestVerification, selectedRecentScan]);

  const loadDashboard = useCallback(async () => {
    const [statsData, recentData] = await Promise.all([
      getSecurityStats(),
      getRecentVerifications(),
    ]);
    setStats(statsData);
    setRecentVerifications(recentData);
    setSelectedRecentScanKey(current => {
      if (current && recentData.some((record, index) => getRecentVerificationKey(record, index) === current)) {
        return current;
      }
      return recentData.length > 0 ? getRecentVerificationKey(recentData[0], 0) : null;
    });
  }, []);

  const clearVerificationResult = useCallback(() => {
    setLatestVerification(null);
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimeoutRef.current !== null) {
      window.clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  const resetCurrentEntry = useCallback(() => {
    if (mode === 'pass') {
      setPassNumber('');
      setPassToken('');
    } else {
      setGuestQrToken('');
    }
    clearVerificationResult();
  }, [clearVerificationResult, mode]);

  const executeVerification = useCallback(
    async ({
      mode,
      passNumber: nextPassNumber = '',
      passToken: nextPassToken = '',
      guestQrToken: nextGuestQrToken = '',
    }: VerifyRequestInput) => {
      clearVerificationResult();

      if (mode === 'pass' && !nextPassNumber.trim()) {
        showToast('Pass number is required', 'warning');
        return;
      }

      if (mode === 'guest' && !nextGuestQrToken.trim()) {
        showToast('Guest QR token is required', 'warning');
        return;
      }

      setIsVerifying(true);
      try {
        if (mode === 'pass') {
          const result = await verifyDigitalPass(
            nextPassNumber.trim(),
            user?.name || 'Security Personnel',
            nextPassToken.trim() || undefined
          );
          setLatestVerification({ kind: 'pass', data: result });
          showToast(
            result.valid ? 'Pass is valid' : result.message || 'Pass validation failed',
            result.valid ? 'success' : 'warning'
          );
        } else {
          const result = await verifyGuestQr(nextGuestQrToken.trim());
          setLatestVerification({ kind: 'guest', data: result });
          showToast(
            result.valid ? 'Guest QR is valid' : result.message || result.reason || 'Guest QR validation failed',
            result.valid ? 'success' : 'warning'
          );
        }

        await loadDashboard();
        } catch (error) {
          showToast(getVerificationErrorMessage(error), 'error');
      } finally {
        setIsVerifying(false);
      }
    },
    [clearVerificationResult, loadDashboard, showToast, user?.name]
  );

  const handleScannedQrValue = useCallback(
    async (rawValue: string, source: ScanSource, shouldVerify = true) => {
      const parsed = parseScannedQrValue(rawValue);

      if (!parsed) {
        setScannerStatus('QR detected, but the format was not recognized. Use manual entry if needed.');
        showToast('QR code format not recognized', 'warning');
        return;
      }

      setLastScanSource(source);
      setScannerStatus(
        `${source === 'camera' ? 'Camera' : 'Uploaded image'} ${
          shouldVerify ? 'scanned successfully' : 'loaded successfully'
        }. ${parsed.mode === 'pass' ? 'Digital pass detected.' : 'Guest QR detected.'}`
      );

      if (parsed.mode === 'pass') {
        setMode('pass');
        setPassNumber(parsed.passNumber || '');
        setPassToken(parsed.passToken || '');
        setGuestQrToken('');
      } else {
        setMode('guest');
        setGuestQrToken(parsed.guestQrToken || '');
        setPassNumber('');
        setPassToken('');
      }

      showToast(
        `${parsed.mode === 'pass' ? 'Digital pass' : 'Guest QR'} detected from ${source}.`,
        'success'
      );

      if (!shouldVerify) {
        clearVerificationResult();
        return;
      }

      await executeVerification({
        mode: parsed.mode,
        passNumber: parsed.passNumber,
        passToken: parsed.passToken,
        guestQrToken: parsed.guestQrToken,
      });
    },
    [clearVerificationResult, executeVerification, showToast]
  );

  const usePassForVerification = (number: string, token?: string) => {
    setMode('pass');
    setPassNumber(number);
    setPassToken(token || '');
    setGuestQrToken('');
    clearVerificationResult();
    showToast('Pass loaded into the verification desk', 'info');
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadDashboard();
      } catch {
        showToast('Failed to load security dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [loadDashboard, showToast]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (!modeParam) return;

    if (modeParam === 'pass') {
      const nextPassNumber = searchParams.get('passNumber') || '';
      const nextPassToken = searchParams.get('passToken') || '';
      if (nextPassNumber) {
        setMode('pass');
        setPassNumber(nextPassNumber);
        setPassToken(nextPassToken);
        setGuestQrToken('');
        clearVerificationResult();
        showToast('Pass loaded into the verification desk', 'info');
      }
    }

    if (modeParam === 'guest') {
      const nextGuestQrToken = searchParams.get('guestToken') || '';
      if (nextGuestQrToken) {
        setMode('guest');
        setGuestQrToken(nextGuestQrToken);
        setPassNumber('');
        setPassToken('');
        clearVerificationResult();
        showToast('Guest QR token loaded into the verification desk', 'info');
      }
    }

    setSearchParams({}, { replace: true });
  }, [clearVerificationResult, searchParams, setSearchParams, showToast]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!isCameraActive || !cameraStreamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = cameraStreamRef.current;
    void video.play().catch(() => {});
  }, [isCameraActive]);

  useEffect(() => {
    if (!isCameraActive) return;

    const detector = createQrDetector();
    if (!detector) return;

    let cancelled = false;

    const scanFrame = async () => {
      if (cancelled || !videoRef.current) return;

      try {
        const video = videoRef.current;
        if (video.readyState >= 2) {
          const results = await detector.detect(video);
          const rawValue = results[0]?.rawValue?.trim();
          if (rawValue) {
            stopCamera();
            await handleScannedQrValue(rawValue, 'camera');
            return;
          }
        }
      } catch {
        /* ignore intermittent detector errors while frames warm up */
      }

      scanTimeoutRef.current = window.setTimeout(() => {
        void scanFrame();
      }, 450);
    };

    void scanFrame();

    return () => {
      cancelled = true;
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };
  }, [handleScannedQrValue, isCameraActive, stopCamera]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDashboard();
      showToast('Security data refreshed', 'success');
    } catch {
      showToast('Failed to refresh security data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setStudentResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStudentPasses(query);
      setStudentResults(results);
      if (results.length === 0) {
        showToast('No students found for the search query', 'info');
      }
    } catch {
      showToast('Student search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeVerification({
      mode,
      passNumber,
      passToken,
      guestQrToken,
    });
  };

  const handleUploadQrClick = () => {
    fileInputRef.current?.click();
  };

  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    stopCamera();
    setLastScanSource('upload');
    setScannerStatus(`Scanning uploaded image: ${file.name}`);

    try {
      const rawValue = await decodeQrFromUploadedFile(file);

      if (!rawValue) {
        setScannerStatus('No QR code was detected in the uploaded image.');
        showToast('No QR code detected in image', 'warning');
        return;
      }

      await handleScannedQrValue(rawValue, 'upload', false);
    } catch {
      setScannerStatus('Unable to read the uploaded QR image. Try a clearer image or use camera/manual entry.');
      showToast('Failed to scan uploaded QR image', 'error');
    }
  };

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerStatus('Camera access is not available in this browser.');
      showToast('Camera access is not available', 'warning');
      return;
    }

    stopCamera();
    setIsStartingCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      setLastScanSource('camera');
      if (createQrDetector()) {
        setScannerStatus('Camera ready. Point it at a QR code to scan automatically.');
      } else {
        setScannerStatus('Camera preview ready. QR auto-scan is not supported in this browser. Use upload or manual entry.');
        showToast('Camera preview started, but QR auto-scan is not supported in this browser', 'warning');
      }
    } catch {
      setScannerStatus('Camera access denied or unavailable. Use upload or manual entry instead.');
      showToast('Unable to access camera', 'error');
    } finally {
      setIsStartingCamera(false);
    }
  };

  return (
    <AppShell pageTitle="Gate Security Scanner">
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

        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} height="112px" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map(card => (
                <div
                  key={card.label}
                  className="rounded-[24px] border border-surface-200/80 bg-white p-5 shadow-glass-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconWrap}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{card.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-900/80 bg-[#0f1729] shadow-[0_24px_60px_rgba(15,23,41,0.24)]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleQrFileChange}
              />
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-2.5 pt-2.5 pb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Verification Camera Desk</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {isCameraActive ? 'Camera active' : 'Ready to scan'}
                </div>
              </div>

              <div className="px-2.5 pt-3 pb-2.5">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
                  <button
                    type="button"
                    aria-pressed={mode === 'pass'}
                    onClick={() => {
                      setMode('pass');
                      clearVerificationResult();
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'pass'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Verify Digital Pass
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === 'guest'}
                    onClick={() => {
                      setMode('guest');
                      clearVerificationResult();
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'guest'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Verify Guest QR
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUploadQrClick}
                    icon={<ArrowUpTrayIcon className="h-4 w-4" />}
                    className="!border-white/15 !bg-white/10 !text-white hover:!bg-white/15"
                  >
                    Upload QR
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStartCamera}
                    loading={isStartingCamera}
                    icon={<VideoCameraIcon className="h-4 w-4" />}
                    className="!bg-cyan-500 !text-slate-950 hover:!bg-cyan-400"
                  >
                    Use Camera
                  </Button>
                  {isCameraActive ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={stopCamera}
                      icon={<StopIcon className="h-4 w-4" />}
                      className="!border-white/15 !bg-white/10 !text-white hover:!bg-white/15"
                    >
                      Stop Camera
                    </Button>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-2">
                  <div className="relative mx-auto aspect-[1.04] max-w-[380px] overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900">
                    {isCameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_55%)]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10">
                            {lastScanSource === 'upload' ? (
                              <PhotoIcon className="h-10 w-10 text-white/35" />
                            ) : (
                              <QrCodeIcon className="h-10 w-10 text-white/35" />
                            )}
                          </div>
                          <p className="mt-4 text-sm font-medium text-slate-200">Use camera or upload QR</p>
                        </div>
                      </>
                    )}

                    <div className="absolute inset-x-[18%] top-[18%] h-0.5 bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
                    <div className="absolute inset-[18%] rounded-[24px] border-2 border-cyan-400/80 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_32px_rgba(34,211,238,0.24)]" />
                    
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <Badge variant={mode === 'pass' ? 'info' : 'warning'} size="small">
                    {mode === 'pass' ? 'Pass desk active' : 'Guest desk active'}
                  </Badge>
                  <span className="sr-only">{scannerStatus}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-surface-200/80 bg-white p-6 shadow-glass-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Manual Entry</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {mode === 'pass' ? 'Verify pass number' : 'Verify guest QR token'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the identifier manually if the scanner cannot read it cleanly.
                  </p>
                </div>
                <Badge variant={mode === 'pass' ? 'info' : 'warning'} size="small">
                  {mode === 'pass' ? 'Digital Pass' : 'Guest QR'}
                </Badge>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleVerify}>
                {mode === 'pass' ? (
                  <>
                    <Input
                      label="Pass Number"
                      value={passNumber}
                      onChange={e => setPassNumber(e.target.value)}
                      placeholder="Example: PASS20260322001"
                      required
                    />
                    <Input
                      label="Verification Token (Optional)"
                      value={passToken}
                      onChange={e => setPassToken(e.target.value)}
                      placeholder="Optional verification code"
                    />
                  </>
                ) : (
                  <Input
                    label="Guest QR Token"
                    value={guestQrToken}
                    onChange={e => setGuestQrToken(e.target.value)}
                    placeholder="Paste scanned guest QR token"
                    required
                  />
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    loading={isVerifying}
                    icon={<ShieldCheckIcon className="h-4 w-4" />}
                    className="!rounded-2xl !px-5"
                  >
                    {mode === 'pass' ? 'Verify Pass' : 'Verify Guest QR'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetCurrentEntry}>
                    Clear
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-[28px] border p-6 shadow-glass-sm ${resultTone.shell}`}>
              <div className={`flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 ${resultTone.banner}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                    <resultTone.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      {latestVerification ? 'Latest verification' : 'Ready state'}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">{resultTone.title}</h3>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{resultTone.subtitle}</p>
                  </div>
                </div>
                <Badge variant={resultTone.badge} size="small">
                  {latestVerification ? (latestVerification.data.valid ? 'Verified' : 'Blocked') : 'Standby'}
                </Badge>
              </div>

              {!latestVerification && !selectedRecentScan ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-slate-200 bg-white/80 p-8 text-center dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                    <QrCodeIcon className="h-8 w-8 text-slate-400 dark:text-slate-300" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">No verification yet</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    When a pass or guest QR is verified, this panel will show the decision and the key person details.
                  </p>
                </div>
              ) : latestVerification?.kind === 'pass' ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Student</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {latestVerification.data.student_name || 'Unknown student'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {latestVerification.data.student_id || '—'} {latestVerification.data.room_number ? `• Room ${latestVerification.data.room_number}` : ''}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Pass record</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {latestVerification.data.pass_number || passNumber || '—'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Status: {latestVerification.data.status || (latestVerification.data.valid ? 'Valid' : 'Invalid')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Decision note</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {latestVerification.data.message || latestVerification.data.error || 'Verification complete'}
                    </p>
                  </div>
                </div>
              ) : latestVerification?.kind === 'guest' ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Guest</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {latestVerification.data.guest_name || 'Unknown guest'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {latestVerification.data.guest_phone || 'No phone provided'}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Host student</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {latestVerification.data.host_student || '—'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {latestVerification.data.host_student_id || '—'} {latestVerification.data.host_room ? `• Room ${latestVerification.data.host_room}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Visit window</p>
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                        {latestVerification.data.valid_from && latestVerification.data.valid_until
                          ? formatDateRange(latestVerification.data.valid_from, latestVerification.data.valid_until)
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Verified at {formatDateTime(latestVerification.data.verified_at)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Visit type</p>
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                        {formatVisitType(latestVerification.data.visit_type)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Request ID: {latestVerification.data.request_id || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Purpose / message</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {latestVerification.data.visit_purpose ||
                        latestVerification.data.message ||
                        latestVerification.data.reason ||
                        'Verification complete'}
                    </p>
                  </div>
                </div>
              ) : selectedRecentScan ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Student</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {selectedRecentScan.student_name || 'Unknown student'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedRecentScan.student_id || '—'}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Scan status</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedRecentScan.status}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Pass {selectedRecentScan.pass_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Verified by</p>
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{selectedRecentScan.verified_by || '—'}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(selectedRecentScan.verification_time)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Desk note</p>
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">Main Gate</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {selectedRecentScan.verification_time
                          ? formatRelativeTime(selectedRecentScan.verification_time)
                          : 'Recorded recently'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Notes</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {selectedRecentScan.notes || 'No additional notes were recorded for this scan.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-surface-200/80 bg-white p-6 shadow-glass-sm dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">Recent Scans</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">Verification activity</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Quick view of gate decisions in the last 24 hours.
                  </p>
                </div>

                <div className="flex rounded-2xl bg-surface-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setRecentScanFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      recentScanFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentScanFilter('alerts')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      recentScanFilter === 'alerts'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                  >
                    Alerts Only
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {filteredRecentScans.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      {recentScanFilter === 'alerts'
                        ? 'No alert scans in the last 24 hours.'
                        : 'No verifications in the last 24 hours.'}
                    </p>
                  </div>
                ) : (
                  filteredRecentScans.map((record, idx) => (
                    <div
                      key={getRecentVerificationKey(record, idx)}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedRecentScanKey(getRecentVerificationKey(record, idx));
                        setLatestVerification(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRecentScanKey(getRecentVerificationKey(record, idx));
                          setLatestVerification(null);
                        }
                      }}
                      className={`flex items-start gap-3 rounded-[22px] border px-4 py-3 transition-all ${
                        selectedRecentScanKey === getRecentVerificationKey(record, idx)
                          ? 'border-brand-300 bg-brand-50/70 shadow-sm dark:border-brand-500 dark:bg-brand-950/40'
                          : 'border-surface-200/80 bg-surface-50/50 hover:border-surface-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-surface-200 dark:bg-slate-800 dark:ring-slate-700">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                          {(record.student_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{record.student_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {record.student_id} • Pass {record.pass_number}
                            </p>
                          </div>
                          <Badge variant={getStatusBadge(record.status)} size="small">
                            {record.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-300">
                          <span>Main Gate</span>
                          <span>{record.verification_time ? formatRelativeTime(record.verification_time) : 'Recorded recently'}</span>
                          <span>By {record.verified_by}</span>
                        </div>
                        {record.notes ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{record.notes}</p> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <Card className="rounded-[28px]">
            <Card.Header title="Search Student Passes" />
            <Card.Body>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSearch}>
                <div className="flex-1">
                  <Input
                    label="Student Name or ID"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or student ID"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={isSearching}
                  icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                >
                  Search
                </Button>
              </form>

              <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
                {studentResults.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-surface-300 px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">Search by student name or ID to inspect active passes.</p>
                  </div>
                ) : (
                  studentResults.map(student => {
                    const latestPass = student.active_passes[0];
                    return (
                      <div key={student.student_id} className="rounded-[22px] border border-surface-200/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {student.student_id} • Room {student.room_number}
                            </p>
                          </div>
                          <Badge variant={student.has_active_pass ? 'success' : 'warning'} size="small">
                            {student.has_active_pass ? 'Active Pass' : 'No Active Pass'}
                          </Badge>
                        </div>

                        {latestPass ? (
                          <>
                            <p className="mt-3 text-sm text-slate-700">
                              Latest pass: <span className="font-medium">{latestPass.pass_number}</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateRange(latestPass.from_date, latestPass.to_date)} • {latestPass.days_remaining} day(s) left
                            </p>
                            <div className="mt-3">
                              <Button
                                size="small"
                                variant="secondary"
                                onClick={() => usePassForVerification(latestPass.pass_number, latestPass.verification_code)}
                              >
                                Load Pass
                              </Button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </Card.Body>
          </Card>
        </section>
      </div>
    </AppShell>
  );
};

export default SecurityDashboard;
