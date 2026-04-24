/**
 * Shared Component Library
 * Essential UI components for the HCI Frontend Redesign
 */

export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardVariant,
} from './Card';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { default as Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { default as Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerColor } from './Spinner';

export { default as Skeleton, SkeletonText, SkeletonCard } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { default as Header } from './Header';
export type { HeaderProps } from './Header';

export { default as Navigation } from './Navigation';
export type { NavigationProps, NavLink } from './Navigation';

export { default as Layout } from './Layout';
export type {
  LayoutProps,
  LayoutContainerProps,
  LayoutGridProps,
  LayoutSectionProps,
} from './Layout';

export { default as ErrorBoundary } from './ErrorBoundary';
