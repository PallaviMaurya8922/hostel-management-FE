import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Textarea from '../Textarea';
import Button from '../Button';
import {
  createLeaveRequest,
  type CreateLeaveRequestData,
} from '../../api/requests';
import { useToast } from '../../contexts/ToastContext';
import { useDashboardRefresh } from '../../contexts/DashboardRefreshContext';

/**
 * Leave Request Modal Component
 * Simple form with inline validation for submitting leave requests
 * Requirements: 10.1, 7.2, 7.5, 7.9, 7.3, 7.4, 7.10, 2.3, 6.3, 10.4, 10.5
 */

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact: string;
}

interface FormErrors {
  start_date?: string;
  end_date?: string;
  reason?: string;
  emergency_contact?: string;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const { refreshPasses, refreshLeaves } = useDashboardRefresh();

  const [formData, setFormData] = useState<FormData>({
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const today = new Date();
  const todayLocalDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        emergency_contact: '',
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validate individual field
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'start_date':
        if (!value) return 'Start date is required';
        if (value < todayLocalDate) return 'Start date cannot be in the past';
        break;
      case 'end_date':
        if (!value) return 'End date is required';
        if (value < todayLocalDate) return 'End date cannot be in the past';
        if (formData.start_date && value < formData.start_date) {
          return 'End date must be after start date';
        }
        break;
      case 'reason':
        if (!value.trim()) return 'Reason is required';
        if (value.length > 500) return 'Reason must not exceed 500 characters';
        break;
      case 'emergency_contact':
        if (!value) return 'Parent contact is required';
        // Remove all non-digit characters for validation
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 10) return 'Phone number must be 10 digits';
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
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle input blur
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on blur
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      start_date: true,
      end_date: true,
      reason: true,
      emergency_contact: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CreateLeaveRequestData = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
        emergency_contact: formData.emergency_contact,
      };

      await createLeaveRequest(submitData);

      // Show success toast
      showToast('Leave request submitted successfully', 'success');

      // Refresh dashboard data
      await Promise.all([refreshPasses(), refreshLeaves()]);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      // Handle server-side validation errors
      if (error.response?.data) {
        const serverErrors = error.response.data;
        const newErrors: FormErrors = {};

        // Map server errors to form fields
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
        if (serverErrors.reason) {
          newErrors.reason = Array.isArray(serverErrors.reason)
            ? serverErrors.reason[0]
            : serverErrors.reason;
        }
        if (serverErrors.emergency_contact) {
          newErrors.emergency_contact = Array.isArray(
            serverErrors.emergency_contact
          )
            ? serverErrors.emergency_contact[0]
            : serverErrors.emergency_contact;
        }

        setErrors(newErrors);

        // Show generic error toast if no field-specific errors
        if (Object.keys(newErrors).length === 0) {
          const errorMessage =
            serverErrors.detail ||
            serverErrors.message ||
            'Failed to submit leave request. Please try again.';
          showToast(errorMessage, 'error');
        } else {
          showToast('Please fix the errors and try again', 'error');
        }
      } else {
        // Network or other errors
        showToast(
          error.message ||
            'Failed to submit leave request. Please check your connection.',
          'error'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.start_date &&
    formData.end_date &&
    formData.reason.trim() &&
    formData.emergency_contact &&
    Object.keys(errors).length === 0;

  const characterCount = formData.reason.length;
  const characterLimit = 500;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            Submit Request
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Start Date"
          type="date"
          name="start_date"
          value={formData.start_date}
          min={todayLocalDate}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.start_date ? errors.start_date : undefined}
          required
        />

        <Input
          label="End Date"
          type="date"
          name="end_date"
          value={formData.end_date}
          min={formData.start_date || todayLocalDate}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.end_date ? errors.end_date : undefined}
          required
        />

        <div>
          <Textarea
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.reason ? errors.reason : undefined}
            placeholder="Please provide a reason for your leave request"
            maxLength={characterLimit}
            required
          />
          <p className="mt-1 text-xs text-slate-400 text-right">
            {characterCount}/{characterLimit} characters
          </p>
        </div>

        <Input
          label="Parent Contact"
          type="tel"
          name="emergency_contact"
          value={formData.emergency_contact}
          onChange={handleChange}
          onBlur={handleBlur}
          error={
            touched.emergency_contact ? errors.emergency_contact : undefined
          }
          placeholder="10-digit phone number"
          maxLength={10}
          required
        />
      </form>
    </Modal>
  );
};

export default LeaveRequestModal;
