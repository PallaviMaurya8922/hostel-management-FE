# Shared Component Library

Essential UI components for the HCI Frontend Redesign project. These components form the foundation of the design system and are used throughout the Student Dashboard.

## Components

### Button

Multi-variant button component with loading states and full accessibility support.

**Variants:**

- `primary` - Main actions (blue background)
- `secondary` - Alternative actions (gray background)
- `danger` - Destructive actions (red background)
- `ghost` - Tertiary actions (transparent background)

**Features:**

- Loading state with spinner
- Minimum touch target: 44x44px
- Keyboard support (Enter/Space)
- ARIA labels for icon-only buttons
- Disabled state

**Usage:**

```tsx
import { Button } from '@/components';

<Button variant="primary" loading={isLoading} onClick={handleClick}>
  Submit
</Button>;
```

### Card

Flexible card component with header, body, and footer sections.

**Variants:**

- `default` - Standard card with all sections
- `compact` - Reduced padding
- `highlighted` - Colored left border for emphasis
- `interactive` - Hover effects and click handler

**Features:**

- Consistent styling: white background, gray border, subtle shadow
- Optional badge in header
- Keyboard navigation for interactive cards

**Usage:**

```tsx
import { Card, Badge } from '@/components';

<Card variant="default">
  <Card.Header
    title="Card Title"
    badge={<Badge variant="success">Active</Badge>}
  />
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>;
```

### Modal

Accessible modal dialog with backdrop and keyboard support.

**Features:**

- Backdrop overlay (black, 50% opacity)
- Centered container with max-width
- Backdrop click-to-close
- Escape key handler
- Disables body scroll when open
- Traps keyboard focus within modal
- Auto-focuses first input field
- Fade-in + scale-up animation (200ms)
- Full ARIA attributes

**Usage:**

```tsx
import { Modal, Button } from '@/components';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </>
  }
>
  <p>Modal content</p>
</Modal>;
```

### Badge

Status indicator component with consistent color coding.

**Variants:**

- `success` - Green (approved/active)
- `warning` - Yellow (pending)
- `danger` - Red (rejected/error)
- `info` - Blue (informational)

**Features:**

- Icon support for accessibility
- 4.5:1 contrast ratio
- Small and medium sizes

**Usage:**

```tsx
import { Badge } from '@/components';

<Badge variant="success">Active</Badge>
<Badge variant="warning" icon={<Icon />}>Pending</Badge>
```

### Input

Text input component with label, validation, and error display.

**Features:**

- Gray border, blue focus ring, red error state
- Font size: 16px minimum (prevents iOS zoom)
- Required field indicator (red asterisk)
- Inline validation on blur
- Helper text support
- Full ARIA attributes

**Usage:**

```tsx
import { Input } from '@/components';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
  required
/>;
```

### Select

Dropdown select component with consistent styling.

**Features:**

- Same styling as Input component
- Chevron icon
- Placeholder support
- Error and helper text

**Usage:**

```tsx
import { Select } from '@/components';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<Select
  label="Choose Option"
  options={options}
  value={selected}
  onChange={e => setSelected(e.target.value)}
  placeholder="Select an option"
  required
/>;
```

### Textarea

Multi-line text input component.

**Features:**

- Same styling as Input component
- Min height: 100px
- Resize: vertical only
- Error and helper text

**Usage:**

```tsx
import { Textarea } from '@/components';

<Textarea
  label="Description"
  value={description}
  onChange={e => setDescription(e.target.value)}
  helperText="Maximum 500 characters"
  required
/>;
```

### Spinner

Loading spinner for async operations.

**Sizes:**

- `small` - 16px
- `medium` - 24px
- `large` - 32px

**Colors:**

- `blue` - Primary actions
- `gray` - Secondary actions

**Usage:**

```tsx
import { Spinner } from '@/components';

<Spinner size="medium" color="blue" />;
```

### Skeleton

Skeleton loader for content placeholders.

**Variants:**

- `text` - Text lines
- `circular` - Avatar/icon placeholders
- `rectangular` - Card/image placeholders

**Predefined Components:**

- `SkeletonText` - Multiple text lines
- `SkeletonCard` - Card placeholder

**Usage:**

```tsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components';

<Skeleton width="100%" height="2rem" variant="rectangular" />
<SkeletonText lines={3} />
<SkeletonCard />
```

### Header

Header component with logo, user name, and logout button.

**Features:**

- Responsive: stacks on mobile, horizontal on desktop
- Semantic HTML: `<header>` tag with `role="banner"`
- White background with bottom border
- Consistent padding

**Usage:**

```tsx
import { Header } from '@/components';

<Header
  userName="Rajesh Kumar"
  onLogout={handleLogout}
  logoText="Hostel Management"
/>;
```

### Navigation

Navigation component with horizontal menu and active page highlighting.

**Features:**

- Responsive: horizontal on desktop, collapsible on mobile
- ARIA attributes: `aria-current="page"` for active link
- Semantic HTML: `<nav>` tag with `role="navigation"`
- Logical tab order
- Mobile menu toggle with hamburger icon

**Usage:**

```tsx
import { Navigation } from '@/components';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', isActive: true },
  { label: 'Profile', href: '/profile', isActive: false },
];

<Navigation links={navLinks} onNavigate={handleNavigate} />;
```

### Layout

Responsive layout container with mobile-first grid system.

**Features:**

- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Layout: single-column (mobile), two-column (tablet), three-column (desktop)
- Semantic HTML: `<main>` tag for main content
- Composable sub-components: Container, Grid, Section

**Sub-components:**

- `Layout.Container` - Max-width container with responsive padding
- `Layout.Grid` - Responsive grid system
- `Layout.Section` - Section wrapper with consistent spacing

**Usage:**

```tsx
import { Layout, Card } from '@/components';

<Layout>
  <Layout.Container maxWidth="xl">
    <Layout.Section>
      <h2>Dashboard</h2>
    </Layout.Section>

    <Layout.Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
      <Card>Card 1</Card>
      <Card>Card 2</Card>
      <Card>Card 3</Card>
    </Layout.Grid>
  </Layout.Container>
</Layout>;
```

## Design Principles

All components follow HCI principles:

1. **Simplicity** - Clean, focused interfaces with limited choices
2. **Consistency** - Uniform styling and behavior across all components
3. **Feedback** - Immediate visual response to user actions
4. **Accessibility** - Full keyboard navigation and screen reader support
5. **Error Prevention** - Inline validation and constrained inputs

## Accessibility

All components include:

- Proper ARIA attributes
- Keyboard navigation support
- Focus indicators
- Screen reader announcements
- Sufficient color contrast (4.5:1 minimum)
- Semantic HTML elements

## Testing

To view all components in action, import and use the `ComponentShowcase` component:

```tsx
import ComponentShowcase from '@/components/ComponentShowcase';

<ComponentShowcase />;
```

## Status Colors

The design system uses consistent status colors defined in `tailwind.config.js`:

- **Active/Success**: Green (#16a34a)
- **Pending/Warning**: Yellow (#eab308)
- **Rejected/Danger**: Red (#dc2626)
- **Info**: Blue (#3b82f6)

## Requirements Mapping

These components satisfy the following requirements:

- **Requirements 5.1-5.6**: Component specifications
- **Requirements 9.1-9.2**: Accessibility compliance
- **Requirements 4.4, 4.5, 4.8**: Visual hierarchy and consistency
