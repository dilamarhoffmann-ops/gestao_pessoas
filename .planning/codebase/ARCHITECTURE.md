# Architecture

## Pattern
- Client-Server Architecture.
- Frontend: Single Page Application (SPA) built with React and Vite.
- Backend: RESTful API built with Express.js.

## Layers
- **UI Layer**: React components located in `src/pages/` and `src/components/`.
- **API Layer (Client)**: Fetches data via standard HTTP requests (fetch/axios) to `/api/*`.
- **API Layer (Server)**: Express routes defined in `server.ts` handles logic and database interaction.
- **Service Layer**: External integrations (Supabase, S3, OpenAI, Empregare) abstracted in modules or inline in routes.
- **Data Layer**: SQLite handles structured relational data directly on the server, while S3 stores blobs (files, resumes).

## Data Flow
1. User interacts with UI components.
2. Vite dev server proxies `/api` calls to the Express backend running on port 3000.
3. Express server validates auth via Supabase token.
4. Express routes execute SQLite queries or call external APIs (OpenAI / Empregare).
5. Data is returned as JSON to the React frontend.

## Entry Points
- **Frontend**: `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- **Backend**: `server.ts` (starts the Express app and initializes SQLite tables).
