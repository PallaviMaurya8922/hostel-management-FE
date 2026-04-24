# API Client Documentation

This directory contains the API client implementation for the HCI Frontend Redesign project.

## Structure

```
api/
├── client.ts       # Base Axios instance with auth and error handling
├── passes.ts       # Digital passes API methods
├── requests.ts     # Leave, guest, and maintenance request API methods
└── index.ts        # Exports all API methods
```

## Features

### Base Client (`client.ts`)

- **Base URL Configuration**: Uses `VITE_API_BASE_URL` from environment variables
- **Timeout**: Configurable via `VITE_API_TIMEOUT` (default: 10 seconds)
- **Authentication**:
  - Session-based authentication with `withCredentials: true`
  - Automatic CSRF token injection from cookies
- **Error Handling**:
  - 401: Redirects to login page
  - 403: Logs forbidden access
  - 404: Logs resource not found
  - 500: Logs server error
  - Network errors: Logs connection issues

### Passes API (`passes.ts`)

#### `getPasses()`

Fetches digital passes for the authenticated student.

**Returns**: `Promise<DigitalPass[]>`

**Response Structure**:

```typescript
{
  success: boolean;
  passes: DigitalPass[];
}
```

#### `downloadPass(passNumber: string)`

Downloads a digital pass PDF.

**Parameters**:

- `passNumber`: The pass number (e.g., "LP-20250127-1234")

**Returns**: `Promise<Blob>`

### Requests API (`requests.ts`)

#### `getLeaves()`

Fetches leave requests (absence records) for the authenticated student.

**Returns**: `Promise<LeaveRequest[]>`

#### `getGuests()`

Fetches guest requests for the authenticated student.

**Returns**: `Promise<GuestRequest[]>`

#### `getMaintenance()`

Fetches maintenance requests for the authenticated student.

**Returns**: `Promise<MaintenanceRequest[]>`

#### `createLeaveRequest(data: CreateLeaveRequestData)`

Submits a new leave request.

**Parameters**:

```typescript
{
  start_date: string; // ISO date format (YYYY-MM-DD)
  end_date: string; // ISO date format (YYYY-MM-DD)
  reason: string;
  emergency_contact: string;
}
```

**Returns**: `Promise<LeaveRequest>`

#### `createGuestRequest(data: CreateGuestRequestData)`

Submits a new guest request.

**Parameters**:

```typescript
{
  guest_name: string;
  guest_phone: string;
  relationship?: string;
  start_date: string;      // ISO datetime format
  end_date: string;        // ISO datetime format
  purpose: string;
}
```

**Returns**: `Promise<GuestRequest>`

#### `createMaintenanceRequest(data: CreateMaintenanceRequestData)`

Submits a new maintenance request.

**Parameters**:

```typescript
{
  room_number: string;
  issue_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
```

**Returns**: `Promise<MaintenanceRequest>`

## Usage

### Direct API Calls

```typescript
import { getPasses, createLeaveRequest } from '@/api';

// Fetch passes
const passes = await getPasses();

// Create leave request
const newLeave = await createLeaveRequest({
  start_date: '2025-02-01',
  end_date: '2025-02-03',
  reason: 'Family emergency',
  emergency_contact: '+919876543210',
});
```

### With React Query (Recommended)

Use the hooks from `@/hooks` instead of calling API methods directly:

```typescript
import { usePasses, useLeaveRequests } from '@/hooks';

function MyComponent() {
  const { data: passes, isLoading } = usePasses();
  const { data: leaves } = useLeaveRequests();

  // Component logic
}
```

## Backend API Endpoints

The API client connects to the following Django REST Framework endpoints:

- `GET /api/digital-passes/` - Fetch digital passes
- `GET /api/pass/{pass_number}/download/` - Download pass PDF
- `GET /api/absence-records/` - Fetch leave requests
- `POST /api/absence-records/` - Create leave request
- `GET /api/guest-requests/` - Fetch guest requests
- `POST /api/guest-requests/` - Create guest request
- `GET /api/maintenance-requests/` - Fetch maintenance requests
- `POST /api/maintenance-requests/` - Create maintenance request

## Error Handling

All API methods throw errors that can be caught and handled:

```typescript
try {
  const passes = await getPasses();
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.status);
  }
}
```

When using React Query hooks, errors are handled automatically:

```typescript
const { data, isError, error } = usePasses();

if (isError) {
  console.error('Error fetching passes:', error.message);
}
```

## Requirements Satisfied

- **Requirement 6.3**: API client with data fetching methods
- **Requirement 11.4**: Maintains existing backend API contracts
- **Requirement 11.5**: Reuses existing authentication (session-based)
