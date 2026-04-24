import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Card from '../components/Card';
import {
  createMaintenanceRequest,
  getStudentProfile,
  type CreateMaintenanceRequestData,
} from '../api/requests';
import { useToast } from '../contexts/ToastContext';
import { useDashboardRefresh } from '../contexts/DashboardRefreshContext';
import { useAuth } from '../contexts';
import type { Priority } from '../types';

/**
 * Maintenance Request Page Component
 * Dedicated page for maintenance request submission with file upload
 * Requirements: 10.3, 7.5, 7.9, 7.3, 7.4, 7.10, 2.5
 */

interface FormData {
  issue_type: string;
  room_number: string;
  description: string;
  priority: Priority;
  photo?: File;
}

interface FormErrors {
  issue_type?: string;
  room_number?: string;
  description?: string;
  photo?: string;
}

const ISSUE_TYPE_OPTIONS = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC/Air Conditioning' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_DESCRIPTION_LENGTH = 10;

const MaintenanceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { refreshMaintenance, refreshRequests } = useDashboardRefresh();

  const [formData, setFormData] = useState<FormData>({
    issue_type: '',
    room_number: '',
    description: '',
    priority: 'medium',
    photo: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [roomDisplay, setRoomDisplay] = useState<string>('');
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(true);
  const hasValidationErrors = Object.values(errors).some(
    errorMessage => !!errorMessage
  );

  useEffect(() => {
    const loadStudentRoomData = async () => {
      if (!user?.id || user.role !== 'student') {
        setIsLoadingRoom(false);
        return;
      }

      setIsLoadingRoom(true);
      try {
        const studentProfile = await getStudentProfile(user.id);
        const roomNumber = (studentProfile.room_number || '').trim();
        const block = (studentProfile.block || '').trim().toUpperCase();

        setFormData(prev => ({
          ...prev,
          room_number: roomNumber,
        }));
        setRoomDisplay(block ? `${roomNumber} ${block}` : roomNumber);
      } catch {
        setRoomDisplay('');
        showToast(
          'Unable to fetch room details from your profile. Please refresh and try again.',
          'error'
        );
      } finally {
        setIsLoadingRoom(false);
      }
    };

    loadStudentRoomData();
  }, [user?.id, user?.role, showToast]);

  // Auto-set priority based on issue type
  const getPriorityForIssueType = (issueType: string): Priority => {
    if (issueType === 'electrical' || issueType === 'plumbing') {
      return 'high';
    }
    return 'medium';
  };

  // Validate individual field
  const validateField = (
    name: keyof FormData,
    value: any
  ): string | undefined => {
    switch (name) {
      case 'issue_type':
        if (!value) return 'Issue type is required';
        break;
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.length < MIN_DESCRIPTION_LENGTH) {
          return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
        }
        if (value.length > MAX_DESCRIPTION_LENGTH) {
          return `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
        }
        break;
      case 'photo':
        if (value) {
          // Validate file type
          if (!value.type.startsWith('image/')) {
            return 'Only image files are allowed';
          }
          // Validate file size
          if (value.size > MAX_FILE_SIZE) {
            return 'File size must not exceed 5MB';
          }
        }
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate required fields
    const issueTypeError = validateField('issue_type', formData.issue_type);
    if (issueTypeError) {
      newErrors.issue_type = issueTypeError;
      isValid = false;
    }

    const descriptionError = validateField('description', formData.description);
    if (descriptionError) {
      newErrors.description = descriptionError;
      isValid = false;
    }

    if (!formData.room_number.trim()) {
      newErrors.room_number = 'Room information is required';
      isValid = false;
    }

    // Validate photo if provided
    if (formData.photo) {
      const photoError = validateField('photo', formData.photo);
      if (photoError) {
        newErrors.photo = photoError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle issue type change
  const handleIssueTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const issueType = e.target.value;
    const priority = getPriorityForIssueType(issueType);

    setFormData(prev => ({
      ...prev,
      issue_type: issueType,
      priority,
    }));

    // Clear error when user selects
    if (errors.issue_type) {
      setErrors(prev => {
        const { issue_type, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle text input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const nextErrors = { ...prev };
        delete nextErrors[name as keyof FormErrors];
        return nextErrors;
      });
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file
      const error = validateField('photo', file);
      if (error) {
        setErrors(prev => ({ ...prev, photo: error }));
        setFormData(prev => ({ ...prev, photo: undefined }));
        setPhotoPreview(null);
        return;
      }

      // Set file and create preview
      setFormData(prev => ({ ...prev, photo: file }));
      setErrors(prev => {
        const { photo, ...rest } = prev;
        return rest;
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input blur
  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on blur
    let value: any;
    if (name === 'photo') {
      value = formData.photo;
    } else {
      value = (
        e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      ).value;
    }

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
      issue_type: true,
      description: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      if (formData.photo) {
        setUploadProgress(50);
      }

      const submitData: CreateMaintenanceRequestData = {
        room_number: formData.room_number,
        issue_type: formData.issue_type,
        description: formData.description.trim(),
        priority: formData.priority,
        ...(formData.photo ? { photo: formData.photo } : {}),
      };

      await createMaintenanceRequest(submitData);

      if (formData.photo) {
        setUploadProgress(100);
      }

      // Show success toast
      showToast('Maintenance request submitted successfully', 'success');

      // Refresh dashboard data
      await Promise.all([refreshMaintenance(), refreshRequests()]);

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
        if (serverErrors.issue_type) {
          newErrors.issue_type = Array.isArray(serverErrors.issue_type)
            ? serverErrors.issue_type[0]
            : serverErrors.issue_type;
        }
        if (serverErrors.description) {
          newErrors.description = Array.isArray(serverErrors.description)
            ? serverErrors.description[0]
            : serverErrors.description;
        }
        if (serverErrors.photo) {
          newErrors.photo = Array.isArray(serverErrors.photo)
            ? serverErrors.photo[0]
            : serverErrors.photo;
        }
        if (serverErrors.attachment) {
          newErrors.photo = Array.isArray(serverErrors.attachment)
            ? serverErrors.attachment[0]
            : serverErrors.attachment;
        }

        setErrors(newErrors);

        // Show generic error toast if no field-specific errors
        if (Object.keys(newErrors).length === 0) {
          const errorMessage =
            serverErrors.detail ||
            serverErrors.message ||
            'Failed to submit maintenance request. Please try again.';
          showToast(errorMessage, 'error');
        } else {
          showToast('Please fix the errors and try again', 'error');
        }
      } else {
        // Network or other errors
        showToast(
          error.message ||
            'Failed to submit maintenance request. Please check your connection.',
          'error'
        );
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/');
  };

  // Check if form is valid
  const isFormValid =
    formData.room_number.trim().length > 0 &&
    formData.issue_type &&
    formData.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    formData.description.trim().length <= MAX_DESCRIPTION_LENGTH &&
    !isLoadingRoom &&
    !hasValidationErrors;

  const characterCount = formData.description.length;

  return (
    <AppShell pageTitle="Maintenance Request">
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
              <li className="text-slate-900 font-medium">File Complaint</li>
            </ol>
          </nav>

          {/* Page Header */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            File Maintenance Complaint
          </h1>

          {/* Form Card */}
          <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Issue Type"
              name="issue_type"
              value={formData.issue_type}
              onChange={handleIssueTypeChange}
              onBlur={handleBlur}
              options={ISSUE_TYPE_OPTIONS}
              error={touched.issue_type ? errors.issue_type : undefined}
              placeholder="Select issue type"
              required
            />

            <Input
              label="Room Number & Wing"
              type="text"
              name="room_number"
              value={isLoadingRoom ? 'Loading room details...' : roomDisplay}
              readOnly
              disabled
              helperText="Pre-filled from your profile (example: 324 C, 103 A)"
            />

            <div>
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description ? errors.description : undefined}
                placeholder="Please describe the maintenance issue in detail"
                maxLength={MAX_DESCRIPTION_LENGTH}
                required
              />
              <p className="mt-1 text-sm text-slate-500 text-right">
                {characterCount}/{MAX_DESCRIPTION_LENGTH} characters
              </p>
            </div>

            <div>
              <Input
                label="Priority"
                type="text"
                name="priority"
                value={
                  formData.priority === 'high'
                    ? 'High'
                    : formData.priority === 'medium'
                      ? 'Medium'
                      : 'Low'
                }
                readOnly
                disabled
                helperText="Auto-set based on issue type (Electrical/Plumbing = High, Others = Medium)"
              />
            </div>

            <div>
              <label
                htmlFor="photo-upload"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Photo Upload (Optional)
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2.5 text-base border border-surface-200 rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-500 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="mt-1.5 text-sm text-slate-500">
                Max file size: 5MB. Images only. After submit, open your request from the dashboard request history and
                use <span className="font-medium text-slate-700">View Status</span> to see the saved photo (if any).
              </p>
              {errors.photo && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {errors.photo}
                </p>
              )}

              {/* Photo Preview */}
              {photoPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Preview:
                  </p>
                  <img
                    src={photoPreview}
                    alt="Upload preview"
                    className="max-w-full h-auto max-h-64 rounded-2xl border border-surface-200"
                  />
                </div>
              )}

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && formData.photo && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      Uploading...
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
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
                Submit Complaint
              </Button>
            </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default MaintenanceRequestPage;
