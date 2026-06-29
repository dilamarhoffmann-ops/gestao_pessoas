# Structure

## Directory Layout
- `api/` & `scripts/`: Utilities and server-side standalone scripts.
- `src/`: Frontend React source code.
  - `src/pages/`: Main page components (e.g., `HiringPage.tsx`, `ConfigurationPage.tsx`).
  - `src/lib/`: Library code and service abstractions (e.g., `supabase-service.ts`, `s3.ts`).
  - `src/db/`: Frontend or shared database logic/constants.
- `uploads/`: Local fallback or cache for uploaded files.
- `dist/`: Compiled frontend bundle (created after `npm run build`).
- `server.ts`: Monolithic backend Express server containing API routes.

## Key Locations
- **Backend API Routes**: `server.ts` (houses all the Express routes like `/api/candidates`, `/api/lawsuits`).
- **External Proxies**: Empregare API proxy is located inside `server.ts`.
- **Database Initialization**: Also inside `server.ts` (`db.exec(...)` calls for table creation).
- **Environment config**: `.env` and `.env.example`.

## Naming Conventions
- React components use `PascalCase` (e.g., `HiringPage.tsx`).
- Scripts and utility files use `snake_case` or `kebab-case` (e.g., `test_login.mjs`, `translate_gsd.py`).
- API routes use standard RESTful `kebab-case` plural nouns (e.g., `/api/job-openings`).
