## Companio

### Backend Database (Now Firebase Firestore)
- MongoDB has been replaced with Firebase Firestore.
- Backend requires Firebase Admin service-account credentials via `.env`.

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your secrets.
   - Required for backend:
     - `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended), or
     - `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
3. Start server:
   ```bash
   npm start
   ```
4. Start frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # set VITE_API_URL if backend is not localhost:3000
   npm run dev
   ```

### Security Notes
- `JWT_SECRET` and `SESSION_SECRET` should be set in `.env`.
- Google OAuth is optional; if not configured, Google login routes return a clear error instead of crashing startup.
- AI keys are optional:
  - `GROQ_API_KEY` (recommended for free tier)
  - `OPENAI_API_KEY` (used as fallback provider if Groq key is missing)
  - If both are missing, the endpoint still works with a smart local fallback planner.

### Google OAuth Setup
1. Go to Google Cloud Console and create/select a project.
2. Open `APIs & Services -> OAuth consent screen`, configure app details, add test users (while in testing mode).
3. Open `APIs & Services -> Credentials -> Create Credentials -> OAuth client ID`.
4. Choose `Web application`.
5. Add authorized redirect URI:
   - `http://localhost:3000/auth/google/callback`
6. Copy values into `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Firebase Service Account Setup
1. Go to Firebase Console -> your project -> Project settings -> Service accounts.
2. Click `Generate new private key` and download JSON.
3. Use either:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = full JSON on one line, or
   - split fields in `.env`: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### AI Itinerary Assistant
- Route: `/itinerary-assistant` (React app).
- API: `POST /api/ai/itinerary` (auth required).
- Returns day-wise plan with direct Google Maps search links (`mapUrl`) for each place/food stop.
- Swipe UI (dating-style): skip/like each day, mobile + desktop responsive.
- `generatedBy` in response can be `groq`, `openai`, or `fallback`.
- If you see `Missing authorization header`, log in first so token is attached to API calls.

### Checks
- Syntax check:
  ```bash
  npm test
  ```
- Dependency audit:
  ```bash
  npm audit --omit=dev
  ```
