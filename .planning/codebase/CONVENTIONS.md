# Conventions

## Code Style
- **TypeScript**: Used aggressively for both frontend and backend interfaces, though `any` is occasionally present in API routes (`req: any, res: any`).
- **ES Modules**: Used throughout (`type: "module"` in `package.json`, `.mjs` scripts).
- **Asynchronous Code**: Uses `async/await` heavily rather than raw Promises.

## Backend Patterns
- **Monolithic Express File**: Most APIs are grouped into `server.ts`. 
- **Direct Database Access**: Express routes directly execute `db.prepare(...).run(...)` or `db.prepare(...).get(...)`. No heavy ORM (like Prisma/TypeORM) is used; raw SQL is preferred for SQLite.
- **Error Handling**: Standard `try/catch` blocks wrap database and external API operations. Errors are logged to `console.error` and return `500` status JSON responses.

## Authentication
- Express middleware `requireAuth` guards `/api/*` routes.
- Verifies Bearer tokens via Supabase Admin Client.
- Exceptions added for legacy login endpoints.

## File Handling
- Uses `multer` for receiving files and `@aws-sdk/client-s3` for storing them in S3.
- Uploads fallback to local `uploads/` directory if needed, but primary focus is memory storage to S3 directly.
