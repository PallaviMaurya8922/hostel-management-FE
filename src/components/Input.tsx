import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, required, className = '', id, ...props },
    ref
  ) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const baseInputStyles =
      'w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-surface-50 disabled:text-slate-400 disabled:cursor-not-allowed placeholder:text-slate-400';

    const inputStateStyles = error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-surface-300 focus:border-brand-400 focus:ring-brand-100 hover:border-surface-400';

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-label="required">*</span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${inputStateStyles} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
