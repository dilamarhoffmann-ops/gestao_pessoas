# Concerns

## Technical Debt & Architecture
- **Monolithic `server.ts`**: The backend is highly centralized in `server.ts` (1200+ lines). It handles routing, middleware, database setup, raw SQL queries, API integration (OpenAI, S3), and Empregare proxy. This will become difficult to maintain as the project grows. It should be refactored into controllers, routes, and services.
- **Database Migrations**: Database tables are created inline using `db.exec(...)` and migrations are handled via ad-hoc `try/catch` statements modifying table structures directly. This is fragile and should be replaced by a structured migration system.

## Security
- **Type Safety**: Use of `any` types in Express routes (`req: any, res: any`) bypasses TypeScript's safety mechanisms.
- **File Upload Limits**: Memory storage (`multer.memoryStorage()`) is used for uploads (up to 10MB per file). If many large files are uploaded simultaneously, this could lead to Out of Memory (OOM) crashes. Consider using disk storage or streaming directly to S3.
- **Raw SQL Execution**: While SQLite parameterized queries (`?`) are used safely in most places, directly executing SQL queries in API endpoints makes testing and auditing difficult.

## Testing & Reliability
- **Lack of Automated Testing**: There are many standalone `.mjs` and `.ts` test scripts, but no cohesive test suite (like Jest) running in CI. This leaves the system vulnerable to regressions during refactoring.
- **External Dependency Reliance**: The system proxy to `Empregare` API and uses `OpenAI` for core logic. Better error boundaries and retry mechanisms may be needed if these external services experience downtime.
