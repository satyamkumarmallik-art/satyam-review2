
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  database: Database | null;
  // Other Firebase services can be added here
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  database,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  database: Database;
}) {
  const contextValue = useMemo(() => {
    return { firebaseApp, auth, database };
  }, [firebaseApp, auth, database]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useDatabase = () => useFirebase().database;
export const useAuth = () => useFirebase().auth;
