# Dowhy Towing Fleet Maintenance

A mobile-first fleet maintenance management system for Dowhy Towing. Replaces Excel-based tracking with a modern web application.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Validation:** Zod
- **Deployment:** Vercel
- **PWA:** Installable on phones and desktops

## Features

- Vehicle fleet management with VIN tracking
- Mileage/hours/date-based maintenance schedules
- Automatic service-due calculations
- Complete maintenance history
- Parts inventory with auto-decrement
- QR codes for quick vehicle access
- CSV/Excel import
- Role-based access (admin, manager, mechanic)
- Mobile-first responsive design

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account (or local Supabase via Docker)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Fill in your Supabase credentials in `.env.local`
5. Run database migrations against your Supabase project
6. Start the dev server:
   ```bash
   npm run dev
   ```

### Database Migrations

Migration files are in `supabase/migrations/`. Apply them in order to your Supabase project. A seed file (`supabase/seed.sql`) provides sample data for development.

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/       # React components (ui/, layout/, feature-specific)
  lib/
    supabase/       # Supabase client utilities
    utils/          # Helpers (cn, format)
    validators/     # Zod schemas
    services/       # Business logic (maintenance-due calculations)
  types/            # TypeScript types and enums
  hooks/            # React hooks
supabase/
  migrations/       # SQL migration files
  seed.sql          # Development seed data
```

## Implementation Progress

- [x] Phase 1: Project scaffolding, database schema, Zod validators
- [ ] Phase 2: Authentication + layout shell
- [ ] Phase 3: Vehicles CRUD + QR codes
- [ ] Phase 4: Maintenance schedules + records + due calculations
- [ ] Phase 5: Parts inventory
- [ ] Phase 6: Dashboard + reports
- [ ] Phase 7: CSV/Excel import
- [ ] Phase 8: PWA + deployment
