import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Textarea from '../Textarea';
import Button from '../Button';
import {
  createMaintenanceRequest,
  getStudentProfile,
  type CreateMaintenanceRequestData,
} from '../../api/requests';
import { useToast } from '../../contexts/ToastContext';
import { useDashboardRefresh } from '../../contexts/DashboardRefreshContext';
import { useAuth } from '../../contexts';
import type { Priority } from '../../types';

interface MaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_DESCRIPTION_LENGTH = 10;

const MaintenanceRequestModal: React.FC<MaintenanceRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  useEffect(() => {
    if (!isOpen) {
      setFormData(prev => ({
        ...prev,
        issue_type: '',
        description: '',
        priority: 'medium',
        photo: undefined,
      }));
      setErrors({});
      setTouched({});
      setPhotoPreview(null);
      setUploadProgress(0);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
        setFormData(prev => ({ ...prev, room_number: roomNumber }));
        setRoomDisplay(block ? `${roomNumber} ${block}` : roomNumber);
      } catch {
        setRoomDisplay('');
        if (isOpen) {
          showToast('Unable to fetch room details from your profile. Please refresh and try again.', 'error');
        }
      } finally {
        setIsLoadingRoom(false);
      }
    };
    if (isOpen) loadStudentRoomData();
  }, [user?.id, user?.role, showToast, isOpen]);

  const getPriorityForIssueType = (issueType: string): Priority => {
    if (issueType === 'electrical' || issueType === 'plumbing') return 'high';
    return 'medium';
  };

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    switch (name) {
      case 'issue_type':
        if (!value) return 'Issue type is required';
        break;
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.length < MIN_DESCRIPTION_LENGTH) return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
        if (value.length > MAX_DESCRIPTION_LENGTH) return `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
        break;
      case 'photo':
        if (value) {
          if (!value.type.startsWith('image/')) return 'Only image files are allowed';
          if (value.size > MAX_FILE_SIZE) return 'File size must not exceed 5MB';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    const issueTypeError = validateField('issue_type', formData.issue_type);
    if (issueTypeError) { newErrors.issue_type = issueTypeError; isValid = false; }
    
    const descriptionError = validateField('description', formData.description);
    if (descriptionError) { newErrors.description = descriptionError; isValid = false; }
    
    if (!formData.room_number.trim()) { newErrors.room_number = 'Room information is required'; isValid = false; }
    
    if (formData.photo) {
      const photoError = validateField('photo', formData.photo);
      if (photoError) { newErrors.photo = photoError; isValid = false; }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleIssueTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const issueType = e.target.value;
    const priority = getPriorityForIssueType(issueType);
    setFormData(prev => ({ ...prev, issue_type: issueType, priority }));
    if (errors.issue_type) {
      setErrors(prev => { const { issue_type, ...rest } = prev; return rest; });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => { const nextErrors = { ...prev }; delete nextErrors[name as keyof FormErrors]; return nextErrors; });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateField('photo', file);
      if (error) {
        setErrors(prev => ({ ...prev, photo: error }));
        setFormData(prev => ({ ...prev, photo: undefined }));
        setPhotoPreview(null);
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      setErrors(prev => { const { photo, ...rest } = prev; return rest; });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = name === 'photo' ? formData.photo : (e.target as any).value;
    const error = validateField(name as keyof FormData, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ issue_type: true, description: true });

    if (!validateForm()) return;

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

      if (formData.photo) setUploadProgress(100);

      showToast('Maintenance request submitted successfully', 'success');
      await Promise.all([refreshMaintenance(), refreshRequests()]);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      if (error.response?.data) {
        const serverErrors = error.response.data;
        const newErrors: FormErrors = {};
        
        ['issue_type', 'description', 'photo', 'attachment'].forEach(key => {
          if (!serverErrors[key]) return;
          const val = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
          if (key === 'attachment') newErrors.photo = val;
          else newErrors[key as keyof FormErrors] = val;
        });
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
          const errorMessage = serverErrors.detail || serverErrors.message || 'Failed to submit maintenance request. Please try again.';
          showToast(errorMessage, 'error');
        } else {
          showToast('Please fix the errors and try again', 'error');
        }
      } else {
        showToast(error.message || 'Failed to submit maintenance request. Please check your connection.', 'error');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const hasValidationErrors = Object.values(errors).some(errorMessage => !!errorMessage);
  const isFormValid =
    formData.room_number.trim().length > 0 &&
    formData.issue_type &&
    formData.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    formData.description.trim().length <= MAX_DESCRIPTION_LENGTH &&
    !isLoadingRoom &&
    !hasValidationErrors;

  const characterCount = formData.description.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Maintenance Complaint"
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
            Submit Complaint
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          helperText="Pre-filled from your profile"
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

        <Input
          label="Priority"
          type="text"
          name="priority"
          value={formData.priority === 'high' ? 'High' : formData.priority === 'medium' ? 'Medium' : 'Low'}
          readOnly
          disabled
          helperText="Auto-set based on issue type"
        />

        <div>
          <label htmlFor="photo-upload" className="block text-sm font-medium text-slate-700 mb-1.5">
            Photo Upload (Optional)
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2.5 text-base border border-surface-200 rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-500 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          <p className="mt-1.5 text-sm text-slate-500">Max file size: 5MB. Accepted formats: images only</p>
          {errors.photo && <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.photo}</p>}

          {photoPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
              <img src={photoPreview} alt="Upload preview" className="max-w-full h-auto max-h-64 rounded-2xl border border-surface-200" />
            </div>
          )}

          {isSubmitting && uploadProgress > 0 && formData.photo && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Uploading...</span>
                <span className="text-sm font-medium text-slate-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-2">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default MaintenanceRequestModal;