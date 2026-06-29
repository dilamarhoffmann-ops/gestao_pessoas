# Testing

## Frameworks
- Currently, no centralized testing framework like Jest or Vitest is configured in the `package.json`.
- TypeScript compiler is used for basic static checking (`npm run lint` -> `tsc --noEmit`).

## Structure & Practices
- Heavy reliance on standalone execution scripts (e.g., `test_login.mjs`, `test_empregare.mjs`, `test_puppeteer.mjs`). 
- These scripts act as ad-hoc integration and end-to-end tests to verify API endpoints, authentication flows, and external integrations (like Empregare proxy).
- `playwright` or `puppeteer` scripts exist (`test_puppeteer.mjs`), indicating UI or scraping tests.

## Coverage
- Ad-hoc coverage. Tests are triggered manually via `node <script>.mjs` or `tsx <script>.ts`.
- Lacks automated CI test pipelines in the repository configuration.
