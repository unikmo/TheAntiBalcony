import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey() {
  const value = process.env.FIREBASE_PRIVATE_KEY;
  return value ? value.replace(/\\n/g, "\n") : undefined;
}

export function getFirebaseDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "theantibalcony";

  // The emulator never receives production credentials. This lets CI exercise
  // the real Firebase Admin/Firestore code path without exposing a service key.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const app = getApps()[0] ?? initializeApp({ projectId });
    return getFirestore(app);
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();
  if (!clientEmail || !privateKey) return null;

  const app = getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  return getFirestore(app);
}
