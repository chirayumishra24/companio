import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

function parseServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson) {
    try {
      let sanitized = rawJson.trim();
      if ((sanitized.startsWith("'") && sanitized.endsWith("'")) || 
          (sanitized.startsWith('"') && sanitized.endsWith('"'))) {
        sanitized = sanitized.slice(1, -1);
      }
      sanitized = sanitized.replace(/\\"/g, '"');
      const parsed = JSON.parse(sanitized);
      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (err) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_SERVICE_ACCOUNT_KEY JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

const serviceAccount = parseServiceAccountFromEnv();
export const isFirebaseConfigured = Boolean(serviceAccount);

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = isFirebaseConfigured ? admin.firestore() : null;

export function requireFirestore() {
  if (!db) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY)."
    );
  }
  return db;
}

