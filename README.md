## Companio

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your secrets.
3. Start server:
   ```bash
   npm start
   ```

### Security Notes
- `JWT_SECRET` and `SESSION_SECRET` should be set in `.env`.
- Google OAuth is optional; if not configured, Google login routes return a clear error instead of crashing startup.

### Checks
- Syntax check:
  ```bash
  npm test
  ```
- Dependency audit:
  ```bash
  npm audit --omit=dev
  ```
