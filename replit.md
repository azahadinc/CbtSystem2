# Computer-Based Testing (CBT) System

## Overview

A modern web-based examination platform designed for educational institutions. The system enables students to take exams digitally with automatic grading and instant results, while providing administrators with comprehensive tools to manage questions, exams, and view detailed analytics.

The application emphasizes clarity and distraction-free interfaces for students during exams, while offering rich administrative dashboards for exam creation and result analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing without the overhead of React Router

**UI Component Strategy**
- Shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design principles adapted for educational context, prioritizing clarity over decoration
- Custom CSS variables system for theming (light/dark mode support)

**Design System Principles**
- Typography: Inter font family with larger-than-typical text sizes (20% increase) for extended reading comfort during exams
- Spacing: Standardized on Tailwind units (4, 6, 8, 12, 16) for consistent visual rhythm
- Layout: Responsive containers with exam interfaces limited to max-w-4xl for optimal readability, admin dashboards at max-w-7xl
- Student exam interface designed to be completely distraction-free with sticky headers showing timer and progress

**State Management**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- React Context for theme management and global UI state
- Local component state for form inputs and UI interactions

**Key Frontend Features**
- Real-time exam timer with countdown functionality
- Progress tracking with question navigation
- Question flagging system for review
- Form validation with Zod schemas and React Hook Form
- Auto-save capabilities for exam sessions

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the full stack
- Custom middleware for request logging and JSON parsing

**API Design**
- RESTful API structure with resource-based endpoints
- Zod schema validation for all incoming requests
- Standardized error handling with appropriate HTTP status codes
- JSON response format for all API endpoints

**Data Persistence Strategy**
- In-memory storage implementation (MemStorage class) as the current data layer
- Interface-based storage abstraction (IStorage) allowing easy swap to database implementations
- Schema definitions in shared directory for both frontend and backend type safety

**Core Data Models**
- Questions: Support for multiple-choice, true-false, and short-answer question types with difficulty levels
- Exams: Collections of questions with configurable duration, passing scores, and point values
- Exam Sessions: Track active exam attempts with student info, start time, and answers
- Results: Store completed exam outcomes with scores, correctness tracking, and timestamps

**Business Logic**
- Automatic exam grading based on question types and correct answers
- Score calculation with percentage and pass/fail determination
- Session timeout management based on exam duration
- Question randomization capabilities (via questionIds array)

### Project Structure

**Monorepo Organization**
- `/client`: React frontend application
  - `/src/components`: Reusable UI components including shadcn/ui library
  - `/src/pages`: Route-level page components
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions and shared client logic
- `/server`: Express backend application
  - `routes.ts`: API endpoint definitions
  - `storage.ts`: Data persistence layer abstraction
  - `vite.ts`: Development server integration
- `/shared`: Code shared between frontend and backend
  - `schema.ts`: Drizzle ORM schemas and Zod validation schemas
- `/migrations`: Database migration files (prepared for Drizzle ORM)

**Configuration Files**
- TypeScript configuration with path aliases (`@/`, `@shared/`) for clean imports
- Vite config with React plugin and path resolution
- Tailwind config with custom theme extending shadcn/ui design tokens
- Drizzle Kit configuration for PostgreSQL (prepared but not yet active)

### Data Schema Design

**Questions Table**
- UUID primary keys with automatic generation
- JSONB field for storing multiple-choice options
- Support for difficulty levels (easy, medium, hard)
- Subject categorization for filtering and organization

**Exams Table**
- JSONB array storing question IDs for flexible exam composition
- Duration in minutes for time-limited exams
- Active/inactive status flag for exam lifecycle management
- Configurable passing score threshold

**Exam Sessions Table**
- Links to exam and tracks student information
- JSONB field for storing all student answers
- Start time tracking for duration enforcement
- Completion status management

**Results Table**
- JSONB fields for detailed answer correctness tracking
- Percentage score calculation
- Pass/fail boolean determination
- Reference to original exam session for audit trail

## External Dependencies

### Database
- **Drizzle ORM**: Type-safe SQL query builder configured for PostgreSQL
- **@neondatabase/serverless**: PostgreSQL driver for serverless environments
- PostgreSQL database (configured via DATABASE_URL environment variable, currently using in-memory storage as fallback)

### UI Component Libraries
- **Radix UI**: Comprehensive collection of unstyled, accessible UI primitives (@radix-ui/react-*)
- **Recharts**: Charting library for admin dashboard analytics and data visualization
- **Embla Carousel**: Carousel component for potential image galleries or multi-step forms
- **cmdk**: Command palette component for quick navigation
- **Lucide React**: Icon library with consistent, customizable SVG icons

### Form Handling
- **React Hook Form**: Performant form state management with minimal re-renders
- **@hookform/resolvers**: Integration layer for Zod schema validation
- **Zod**: TypeScript-first schema validation for forms and API requests
- **drizzle-zod**: Automatic Zod schema generation from Drizzle ORM schemas

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for component styling
- **clsx** / **tailwind-merge**: Utility for conditional className composition

### Development Tools
- **Vite**: Next-generation frontend build tool with HMR
- **@replit/vite-plugin-***: Replit-specific development plugins for runtime error overlay, cartographer, and dev banner
- **tsx**: TypeScript execution engine for running Node.js with TypeScript

### Date/Time Utilities
- **date-fns**: Modern date utility library for formatting and manipulation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (prepared for authentication implementation)

### Deployment Considerations
- Build process uses esbuild to bundle server code for production
- Separate Vite build for client-side assets
- Environment variable configuration for database connection
- Designed for deployment on platforms supporting Node.js and PostgreSQL