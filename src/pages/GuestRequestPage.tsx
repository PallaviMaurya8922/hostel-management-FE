import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Card from '../components/Card';
import {
  createGuestRequest,
  type CreateGuestRequestData,
} from '../api/requests';
import { useToast } from '../contexts/ToastContext';
import { useDashboardRefresh } from '../contexts/DashboardRefreshContext';

/**
 * Guest Request Page Component
 * Dedicated page for guest request submission with complex form fields
 * Requirements: 10.2, 7.5, 7.9, 7.3, 7.4, 7.10, 2.4
 */

interface FormData {
  guest_name: string;
  visit_type: 'normal' | 'overnight';
  relationship: string;
  guest_phone: string;
  start_date: string;
  end_date: string;
  purpose: string;
}

interface FormErrors {
  guest_name?: string;
  visit_type?: string;
  relationship?: string;
  guest_phone?: string;
  start_date?: string;
  end_date?: string;
  purpose?: string;
}

const VISIT_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal Visit' },
  { value: 'overnight', label: 'Overnight Visit' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'relative', label: 'Relative' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

const GuestRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshGuests, refreshRequests } = useDashboardRefresh();

  const [formData, setFormData] = useState<FormData>({
    guest_name: '',
    visit_type: 'normal',
    relationship: 'other',
    guest_phone: '',
    start_date: '',
    end_date: '',
    purpose: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const splitDateTime = (
    value: string
  ): { date: string; time: string } => {
    if (!value || !value.includes('T')) {
      return { date: '', time: '' };
    }

    const [date, time] = value.split('T');
    return { date, time: time?.slice(0, 5) || '' };
  };

  const buildDateTime = (date: string, time: string): string => {
    if (!date) {
      return '';
    }

    // Keep date selection visible immediately; fallback time avoids clearing the value.
    const safeTime = time || '00:00';
    return `${date}T${safeTime}`;
  };

  const todayDateString = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  const getDateTimeOrderError = (
    startDateTime: string,
    endDateTime: string
  ): string | undefined => {
    if (!startDateTime || !endDateTime) {
      return undefined;
    }

    if (endDateTime <= startDateTime) {
      return formData.visit_type === 'overnight'
        ? 'End date & time must be after start date & time'
        : 'End time must be after start time';
    }

    return undefined;
  };

  const normalizeGuestPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  // Validate individual field
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'guest_name':
        if (!value.trim()) return 'Guest name is required';
        break;
      case 'visit_type':
        if (!value) return 'Visit type is required';
        break;
      case 'guest_phone':
        if (!value) return 'Guest phone is required';
        // Remove all non-digit characters for validation
        const digits = value.replace(/\D/g, '');
        if (digits.length === 10) break;
        if (digits.length === 12 && digits.startsWith('91')) break;
        return 'Phone must be 10 digits or 12 digits starting with 91';
        break;
      case 'relationship':
        if (!value) return 'Relationship is required';
        break;
      case 'start_date':
        if (!value) {
          return formData.visit_type === 'overnight'
            ? 'Start date & time is required'
            : 'Start time is required';
        }
        if (value.slice(0, 10) < todayDateString) {
          return 'Start date cannot be in the past';
        }
        break;
      case 'end_date':
        if (!value) {
          return formData.visit_type === 'overnight'
            ? 'End date & time is required'
            : 'End time is required';
        }
        if (formData.start_date && value <= formData.start_date) {
          return formData.visit_type === 'overnight'
            ? 'End date & time must be after start date & time'
            : 'End time must be after start time';
        }
        break;
      case 'purpose':
        if (!value.trim()) return 'Purpose is required';
        if (value.length > 500) return 'Purpose must not exceed 500 characters';
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === 'guest_phone' ? value.replace(/\D/g, '').slice(0, 12) : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle input blur
  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on blur
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleStartDateChange = (value: string) => {
    const current = splitDateTime(formData.start_date);
    const next = buildDateTime(value, current.time);
    setFormData(prev => ({ ...prev, start_date: next }));
    const orderError = getDateTimeOrderError(next, formData.end_date);
    setErrors(prev => ({
      ...prev,
      end_date: orderError,
    }));
    if (errors.start_date) {
      setErrors(prev => ({ ...prev, start_date: undefined }));
    }
  };

  const handleStartTimeChange = (value: string) => {
    const current = splitDateTime(formData.start_date);
    const baseDate =
      formData.visit_type === 'normal'
        ? todayDateString
        : current.date;
    const next = buildDateTime(baseDate, value);
    setFormData(prev => ({ ...prev, start_date: next }));
    const orderError = getDateTimeOrderError(next, formData.end_date);
    setErrors(prev => ({
      ...prev,
      end_date: orderError,
    }));
    if (errors.start_date) {
      setErrors(prev => ({ ...prev, start_date: undefined }));
    }
  };

  const handleEndDateChange = (value: string) => {
    const current = splitDateTime(formData.end_date);
    const next = buildDateTime(value, current.time);
    setFormData(prev => ({ ...prev, end_date: next }));
    const orderError = getDateTimeOrderError(formData.start_date, next);
    setErrors(prev => ({
      ...prev,
      end_date: orderError,
    }));
  };

  const handleEndTimeChange = (value: string) => {
    const current = splitDateTime(formData.end_date);
    const baseDate =
      formData.visit_type === 'normal'
        ? todayDateString
        : current.date;
    const next = buildDateTime(baseDate, value);
    setFormData(prev => ({ ...prev, end_date: next }));
    const orderError = getDateTimeOrderError(formData.start_date, next);
    setErrors(prev => ({
      ...prev,
      end_date: orderError,
    }));
  };

  const handleVisitTypeChange = (value: 'normal' | 'overnight') => {
    setFormData(prev => {
      const start = splitDateTime(prev.start_date);
      const end = splitDateTime(prev.end_date);
      const withDateIfTimeExists = (date: string, time: string) => {
        if (!date || !time) {
          return '';
        }
        return `${date}T${time}`;
      };

      // Normal visit keeps only time input and auto-uses today's date.
      if (value === 'normal') {
        const nextStart = withDateIfTimeExists(todayDateString, start.time);
        const nextEnd = withDateIfTimeExists(todayDateString, end.time);

        return {
          ...prev,
          visit_type: value,
          start_date: nextStart,
          end_date: nextEnd,
        };
      }

      // Overnight keeps date+time. Preserve explicit dates if present.
      const nextStart = withDateIfTimeExists(
        start.date || todayDateString,
        start.time
      );
      const nextEnd = withDateIfTimeExists(
        end.date || todayDateString,
        end.time
      );

      return {
        ...prev,
        visit_type: value,
        start_date: nextStart,
        end_date: nextEnd,
      };
    });

    if (errors.visit_type) {
      setErrors(prev => ({ ...prev, visit_type: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      guest_name: true,
      visit_type: true,
      relationship: true,
      guest_phone: true,
      start_date: true,
      end_date: true,
      purpose: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CreateGuestRequestData = {
        guest_name: formData.guest_name.trim(),
        visit_type: formData.visit_type,
        relationship: formData.relationship,
        guest_phone: normalizeGuestPhone(formData.guest_phone),
        start_date: formData.start_date,
        end_date: formData.end_date,
        purpose: formData.purpose.trim(),
      };

      const createdRequest = await createGuestRequest(submitData);

      // Show success toast
      if (createdRequest.status === 'approved') {
        showToast('Guest request auto-approved. QR generated for security verification.', 'success');
      } else {
        showToast('Overnight guest request submitted for warden approval.', 'success');
      }

      // Refresh dashboard data
      await Promise.all([refreshGuests(), refreshRequests()]);

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      // Handle server-side validation errors
      if (error.response?.data) {
        const serverErrors = error.response.data;
        const newErrors: FormErrors = {};

        // Map server errors to form fields
        if (serverErrors.guest_name) {
          newErrors.guest_name = Array.isArray(serverErrors.guest_name)
            ? serverErrors.guest_name[0]
            : serverErrors.guest_name;
        }
        if (serverErrors.guest_phone) {
          newErrors.guest_phone = Array.isArray(serverErrors.guest_phone)
            ? serverErrors.guest_phone[0]
            : serverErrors.guest_phone;
        }
        if (serverErrors.visit_type) {
          newErrors.visit_type = Array.isArray(serverErrors.visit_type)
            ? serverErrors.visit_type[0]
            : serverErrors.visit_type;
        }
        if (serverErrors.relationship) {
          newErrors.relationship = Array.isArray(serverErrors.relationship)
            ? serverErrors.relationship[0]
            : serverErrors.relationship;
        }
        if (serverErrors.start_date) {
          newErrors.start_date = Array.isArray(serverErrors.start_date)
            ? serverErrors.start_date[0]
            : serverErrors.start_date;
        }
        if (serverErrors.end_date) {
          newErrors.end_date = Array.isArray(serverErrors.end_date)
            ? serverErrors.end_date[0]
            : serverErrors.end_date;
        }
        if (serverErrors.purpose) {
          newErrors.purpose = Array.isArray(serverErrors.purpose)
            ? serverErrors.purpose[0]
            : serverErrors.purpose;
        }

        setErrors(newErrors);

        // Show generic error toast if no field-specific errors
        if (Object.keys(newErrors).length === 0) {
          const errorMessage =
            serverErrors.detail ||
            serverErrors.message ||
            'Failed to submit guest request. Please try again.';
          showToast(errorMessage, 'error');
        } else {
          showToast('Please fix the errors and try again', 'error');
        }
      } else {
        // Network or other errors
        showToast(
          error.message ||
            'Failed to submit guest request. Please check your connection.',
          'error'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/');
  };

  // Check if form is valid
  const hasValidationErrors = Object.values(errors).some(Boolean);

  const isFormValid =
    formData.guest_name.trim() &&
    formData.visit_type &&
    formData.relationship &&
    formData.guest_phone &&
    formData.start_date &&
    formData.end_date &&
    formData.purpose.trim() &&
    !hasValidationErrors;

  const characterCount = formData.purpose.length;
  const characterLimit = 500;
  const startDateTime = splitDateTime(formData.start_date);
  const endDateTime = splitDateTime(formData.end_date);

  return (
    <AppShell pageTitle="Guest Request">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-slate-600">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-brand-600 transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-slate-900 font-medium">Register Guest</li>
            </ol>
          </nav>

          {/* Page Header */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Register Guest
          </h1>

          {/* Form Card */}
          <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Guest Name"
              type="text"
              name="guest_name"
              value={formData.guest_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.guest_name ? errors.guest_name : undefined}
              placeholder="Enter guest's full name"
              required
            />

            <Select
              label="Visit Type"
              name="visit_type"
              value={formData.visit_type}
              onChange={e =>
                handleVisitTypeChange(e.target.value as 'normal' | 'overnight')
              }
              onBlur={handleBlur}
              options={VISIT_TYPE_OPTIONS}
              error={touched.visit_type ? errors.visit_type : undefined}
              required
            />

            <Select
              label="Relationship"
              name="relationship"
              value={formData.relationship}
              onChange={e =>
                setFormData(prev => ({ ...prev, relationship: e.target.value }))
              }
              onBlur={handleBlur}
              options={RELATIONSHIP_OPTIONS}
              error={touched.relationship ? errors.relationship : undefined}
              required
            />

            <Input
              label="Guest Phone"
              type="tel"
              name="guest_phone"
              value={formData.guest_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.guest_phone ? errors.guest_phone : undefined}
              placeholder="10 digits or 91XXXXXXXXXX"
              maxLength={12}
              required
            />

            {formData.visit_type === 'overnight' && (
              <Input
                label="Start Date"
                type="date"
                name="start_date"
                value={startDateTime.date}
                onChange={e => handleStartDateChange(e.target.value)}
                min={todayDateString}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, start_date: true }));
                  const error = validateField('start_date', formData.start_date);
                  if (error) {
                    setErrors(prev => ({ ...prev, start_date: error }));
                  }
                }}
                error={touched.start_date ? errors.start_date : undefined}
                required
              />
            )}

            <Input
              label="Start Time"
              type="time"
              name="start_time"
              value={startDateTime.time}
              onChange={e => handleStartTimeChange(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, start_date: true }));
                const error = validateField('start_date', formData.start_date);
                if (error) {
                  setErrors(prev => ({ ...prev, start_date: error }));
                }
              }}
              error={touched.start_date ? errors.start_date : undefined}
              required
            />

            {formData.visit_type === 'overnight' && (
              <Input
                label="End Date"
                type="date"
                name="end_date"
                value={endDateTime.date}
                onChange={e => handleEndDateChange(e.target.value)}
                min={startDateTime.date || undefined}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, end_date: true }));
                  const error = validateField('end_date', formData.end_date);
                  if (error) {
                    setErrors(prev => ({ ...prev, end_date: error }));
                  }
                }}
                error={touched.end_date ? errors.end_date : undefined}
                required
              />
            )}

            <Input
              label="End Time"
              type="time"
              name="end_time"
              value={endDateTime.time}
              onChange={e => handleEndTimeChange(e.target.value)}
              min={
                startDateTime.date && endDateTime.date === startDateTime.date
                  ? startDateTime.time || '00:00'
                  : undefined
              }
              onBlur={() => {
                setTouched(prev => ({ ...prev, end_date: true }));
                const error = validateField('end_date', formData.end_date);
                if (error) {
                  setErrors(prev => ({ ...prev, end_date: error }));
                }
              }}
              error={touched.end_date ? errors.end_date : undefined}
              required
            />

            <div>
              <Textarea
                label="Purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.purpose ? errors.purpose : undefined}
                placeholder="Please provide the purpose of the guest visit"
                maxLength={characterLimit}
                required
              />
              <p className="mt-1 text-sm text-slate-500 text-right">
                {characterCount}/{characterLimit} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                fullWidth
              >
                Submit Request
              </Button>
            </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default GuestRequestPage;
