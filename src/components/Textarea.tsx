import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, required, className = '', id, ...props },
    ref
  ) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const baseTextareaStyles =
      'w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-surface-50 disabled:cursor-not-allowed resize-y min-h-[100px] placeholder:text-slate-400';

    const textareaStateStyles = error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-surface-300 focus:border-brand-400 focus:ring-brand-100 hover:border-surface-400';

    return (
      <div className="w-full">
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-label="required">*</span>
          )}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`${baseTextareaStyles} ${textareaStateStyles} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          required={required}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export default Textarea;
