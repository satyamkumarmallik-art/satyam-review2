
'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // The useMemo is not strictly necessary here because initializeFirebase
  // now acts as a singleton, but it's good practice.
  const firebaseState = initializeFirebase();

  return <FirebaseProvider {...firebaseState}>{children}</FirebaseProvider>;
}
