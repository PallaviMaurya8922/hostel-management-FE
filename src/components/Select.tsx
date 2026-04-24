import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, options, error, helperText, required, placeholder, className = '', id, ...props },
    ref
  ) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const baseSelectStyles =
      'w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-surface-50 disabled:cursor-not-allowed appearance-none pr-10';

    const selectStateStyles = error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-surface-300 focus:border-brand-400 focus:ring-brand-100 hover:border-surface-400';

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-label="required">*</span>
          )}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectStyles} ${selectStateStyles} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
