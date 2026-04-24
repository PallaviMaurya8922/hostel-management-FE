# HCI Frontend Redesign - Student Dashboard

This is the redesigned frontend for the Hostel Management System, focusing on Human-Computer Interaction (HCI) principles.

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling with custom status colors
- **React Query** - Server state management
- **Axios** - HTTP client
- **Heroicons** - Icon library
- **ESLint + Prettier** - Code quality and formatting

## Project Structure

```
src/
├── api/          # API client and endpoints
├── components/   # Reusable UI components
├── config/       # Environment configuration
├── hooks/        # Custom React hooks
├── layouts/      # Layout components
├── pages/        # Page components
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Path Aliases

The project uses path aliases for clean imports:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@utils/` → `src/utils/`
- `@types/` → `src/types/`
- `@hooks/` → `src/hooks/`
- `@api/` → `src/api/`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=https://hostel-management-be-jg5f.onrender.com/api
VITE_API_TIMEOUT=10000
VITE_ENV=development
```

## Status Colors

The project uses custom Tailwind colors for status indicators:

- **Active/Approved**: Green (`status-active`)
- **Pending**: Yellow (`status-pending`)
- **Rejected/Error**: Red (`status-rejected`)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Development Guidelines

- Use TypeScript for type safety
- Follow ESLint and Prettier rules
- Use path aliases for imports
- Keep components small and focused
- Write accessible HTML with ARIA labels
- Use Tailwind utility classes for styling
- Maintain consistent status color usage
