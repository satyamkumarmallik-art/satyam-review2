
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseApp } from './config';
import { FirebaseClientProvider } from './client-provider';
import { FirebaseApp } from 'firebase/app';
export { useUser } from './auth/use-user';
export { useFirebase, useFirebaseApp, useAuth, useDatabase } from './provider';

// This is a singleton instance of the firebase services
// It's created once and reused everywhere
let firebaseState: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  database: Database;
} | null = null;


export function initializeFirebase() {
  if (!firebaseState) {
      const app = firebaseApp;
      const auth = getAuth(app);
      const database = getDatabase(app);
      firebaseState = { firebaseApp: app, auth, database };
  }
  return firebaseState;
}

export { FirebaseClientProvider };
