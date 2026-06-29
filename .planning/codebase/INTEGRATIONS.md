# Integrations

## External Services & APIs
1. **Supabase**: Used for authentication and presumably database hosting. Interactions via `@supabase/supabase-js`.
2. **OpenAI**: Used for advanced candidate matching, OCR/Vision analysis of resumes (`gpt-4o` model is referenced in `server.ts`).
3. **Google Generative AI**: Gemini API SDK installed, likely for auxiliary AI tasks or embeddings.
4. **AWS S3**: Storage service for resumes, lawsuit documents, etc., using `@aws-sdk/client-s3`.
5. **Empregare**: A corporate HR API system. The app implements a proxy to `/api/empregare/proxy` to avoid CORS and handle authentication securely.

## Databases
- **SQLite (local/legacy)**: `better-sqlite3` manages local tables like `companies`, `receipt_configurations`, `lawsuits`, `candidates`, `job_openings`.
- **Supabase PostgreSQL**: Managed database and auth.

## Webhooks / Auth Providers
- **JWT**: Internal tokens/sessions (`jsonwebtoken`).
- **Supabase Auth**: Handled via `supabaseAdmin.auth`.
