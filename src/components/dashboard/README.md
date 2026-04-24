# Dashboard Components

This directory contains the Student Dashboard components.

## Components

### WelcomeSection

Displays a personalized greeting with the current date.

**Props**:

- `studentName?: string` - Student's name (defaults to "Student")

**Usage**:

```tsx
import { WelcomeSection } from '@/components/dashboard';

<WelcomeSection studentName="John Doe" />;
```

### QuickActions

Displays 4 action buttons in a responsive grid.

**Actions**:

1. Apply for Leave
2. Register Guest
3. File Complaint
4. View Profile

**Usage**:

```tsx
import { QuickActions } from '@/components/dashboard';

<QuickActions />;
```

### OverviewStats

Displays 4 metrics with real-time data from the API.

**Metrics**:

1. Total Leaves - Lifetime count of leave requests
2. Active Passes - Currently valid digital passes
3. Pending Requests - Requests awaiting approval
4. Complaints - Open maintenance requests

**Usage**:

```tsx
import { OverviewStats } from '@/components/dashboard';

<OverviewStats />;
```

## Complete Dashboard

```tsx
import {
  WelcomeSection,
  QuickActions,
  OverviewStats,
} from '@/components/dashboard';

function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <WelcomeSection studentName="John Doe" />
      <QuickActions />
      <OverviewStats />
    </div>
  );
}
```

## Requirements Satisfied

- **3.1**: Welcome section with greeting and date
- **3.2**: Quick action buttons
- **3.3**: Overview statistics
- **4.1**: Time-based greeting
- **4.7**: Accessible button design
- **6.1**: Data fetching with React Query
- **7.1**: Loading states with skeletons
- **8.2**: Caching with React Query
- **8.7**: Minimum touch target size (44x44px)
- **3.9**: Mobile-first responsive design
