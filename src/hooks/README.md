# React Query Hooks Documentation

This directory contains React Query hooks for data fetching with automatic caching and state management.

## Structure

```
hooks/
├── usePasses.ts      # Hook for fetching digital passes
├── useRequests.ts    # Hooks for fetching leave, guest, and maintenance requests
└── index.ts          # Exports all hooks
```

## Available Hooks

### `usePasses()`

Fetches digital passes for the authenticated student with automatic caching.

**Returns**: `UseQueryResult<DigitalPass[], Error>`

**Cache Configuration**:

- Stale time: 2 minutes
- Cache time: 10 minutes
- Refetch on window focus: disabled

**Usage**:

```typescript
import { usePasses } from '@/hooks';

function PassesSection() {
  const { data: passes, isLoading, isError, error } = usePasses();

  if (isLoading) return <div>Loading passes...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {passes?.map(pass => (
        <div key={pass.pass_number}>{pass.pass_number}</div>
      ))}
    </div>
  );
}
```

### `useLeaveRequests()`

Fetches leave requests (absence records) for the authenticated student.

**Returns**: `UseQueryResult<LeaveRequest[], Error>`

**Cache Configuration**:

- Stale time: 1 minute
- Cache time: 10 minutes

**Usage**:

```typescript
import { useLeaveRequests } from '@/hooks';

function LeaveRequestsList() {
  const { data: leaves, isLoading } = useLeaveRequests();

  return (
    <div>
      <h3>Leave Requests ({leaves?.length || 0})</h3>
      {leaves?.map(leave => (
        <div key={leave.absence_id}>{leave.reason}</div>
      ))}
    </div>
  );
}
```

### `useGuestRequests()`

Fetches guest requests for the authenticated student.

**Returns**: `UseQueryResult<GuestRequest[], Error>`

**Cache Configuration**:

- Stale time: 1 minute
- Cache time: 10 minutes

**Usage**:

```typescript
import { useGuestRequests } from '@/hooks';

function GuestRequestsList() {
  const { data: guests, isLoading } = useGuestRequests();

  return (
    <div>
      <h3>Guest Requests ({guests?.length || 0})</h3>
      {guests?.map(guest => (
        <div key={guest.request_id}>{guest.guest_name}</div>
      ))}
    </div>
  );
}
```

### `useMaintenanceRequests()`

Fetches maintenance requests for the authenticated student.

**Returns**: `UseQueryResult<MaintenanceRequest[], Error>`

**Cache Configuration**:

- Stale time: 1 minute
- Cache time: 10 minutes

**Usage**:

```typescript
import { useMaintenanceRequests } from '@/hooks';

function MaintenanceRequestsList() {
  const { data: maintenance, isLoading } = useMaintenanceRequests();

  return (
    <div>
      <h3>Maintenance Requests ({maintenance?.length || 0})</h3>
      {maintenance?.map(request => (
        <div key={request.request_id}>{request.issue_type}</div>
      ))}
    </div>
  );
}
```

### `useAllRequests()`

Combined hook that fetches all three request types simultaneously.

**Returns**:

```typescript
{
  leaves: UseQueryResult<LeaveRequest[], Error>;
  guests: UseQueryResult<GuestRequest[], Error>;
  maintenance: UseQueryResult<MaintenanceRequest[], Error>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

**Usage**:

```typescript
import { useAllRequests } from '@/hooks';

function AllRequestsSection() {
  const { leaves, guests, maintenance, isLoading, isError } = useAllRequests();

  if (isLoading) return <div>Loading all requests...</div>;
  if (isError) return <div>Error loading requests</div>;

  return (
    <div>
      <section>
        <h3>Leave Requests ({leaves.data?.length || 0})</h3>
        {/* Render leaves */}
      </section>
      <section>
        <h3>Guest Requests ({guests.data?.length || 0})</h3>
        {/* Render guests */}
      </section>
      <section>
        <h3>Maintenance Requests ({maintenance.data?.length || 0})</h3>
        {/* Render maintenance */}
      </section>
    </div>
  );
}
```

## Mutations (Creating Requests)

For creating new requests, use React Query's `useMutation` with the API methods:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLeaveRequest } from '@/api';

function LeaveRequestForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      // Invalidate and refetch leaves after successful creation
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const handleSubmit = (data: CreateLeaveRequestData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Submitting...' : 'Submit'}
      </button>
      {mutation.isError && <p>Error: {mutation.error.message}</p>}
      {mutation.isSuccess && <p>Success!</p>}
    </form>
  );
}
```

## Query Keys

The following query keys are used for caching:

- `['passes']` - Digital passes
- `['leaves']` - Leave requests
- `['guests']` - Guest requests
- `['maintenance']` - Maintenance requests

To manually invalidate cache:

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['passes'] });

// Invalidate all requests
queryClient.invalidateQueries({ queryKey: ['leaves'] });
queryClient.invalidateQueries({ queryKey: ['guests'] });
queryClient.invalidateQueries({ queryKey: ['maintenance'] });
```

## React Query Setup

The React Query client is configured in `src/lib/queryClient.ts` with the following defaults:

- **Stale Time**: 5 minutes (data considered fresh for 5 minutes)
- **Cache Time**: 10 minutes (data kept in cache for 10 minutes)
- **Retry**: 1 attempt on failure
- **Refetch on Window Focus**: Disabled

The QueryClientProvider is set up in `src/main.tsx` to wrap the entire application.

## Benefits of Using Hooks

1. **Automatic Caching**: Data is cached and reused across components
2. **Loading States**: Built-in loading, error, and success states
3. **Automatic Refetching**: Data is refetched when stale
4. **Optimistic Updates**: Easy to implement optimistic UI updates
5. **Request Deduplication**: Multiple components requesting the same data only trigger one API call
6. **Background Refetching**: Data is refetched in the background when stale

## Requirements Satisfied

- **Requirement 6.3**: Data fetching hooks with React Query
- **Requirement 8.2**: Basic caching implementation to minimize unnecessary re-renders
