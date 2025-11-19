
'use client';
import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Laptop, FlaskConical, History, Briefcase, Calculator } from 'lucide-react';
import { useDatabase } from '@/firebase';
import { ref, onValue, push, set, get, remove, query, equalTo, orderByChild } from 'firebase/database';
import { Database, DataSnapshot } from 'firebase/database';

export type Subject = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export type DailyUpdate = {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  content: string;
  date: string;
};

export type Review = {
  id: string;
  updateId: string;
  subjectId: string;
  subjectName: string;
  studentName: string;
  studentId: string;
  registrationNumber: string;
  rating: number;
  comment: string;
  date: string;
};

export const subjects: Subject[] = [
  { id: 'english', name: 'English', icon: BookOpen },
  { id: 'cs', name: 'Computer Science', icon: Laptop },
  { id: 'science', name: 'Science', icon: FlaskConical },
  { id: 'history', name: 'History', icon: History },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'mathematics', name: 'Mathematics', icon: Calculator },
];


// --- React Hooks for components to consume data ---

export const useDailyUpdates = () => {
  const database = useDatabase();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;
    setLoading(true);
    const updatesRef = ref(database, 'updates');
    const unsubscribe = onValue(updatesRef, (snapshot) => {
      const updatesData = snapshot.val();
      const updatesList: DailyUpdate[] = updatesData 
        ? Object.keys(updatesData).map(key => ({ id: key, ...updatesData[key] })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
      setUpdates(updatesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching updates:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [database]);

  return { data: updates, loading };
};

export const useReviews = (subjectId?: string) => {
    const database = useDatabase();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!database) return;
      setLoading(true);
      
      const reviewsRef = ref(database, 'reviews');
      const reviewsQuery = subjectId 
        ? query(reviewsRef, orderByChild('subjectId'), equalTo(subjectId))
        : reviewsRef;

      const unsubscribe = onValue(reviewsQuery, (snapshot) => {
        const reviewsData = snapshot.val();
        const reviewsList: Review[] = reviewsData 
          ? Object.keys(reviewsData).map(key => ({ id: key, ...reviewsData[key] })) 
          : [];
        setReviews(reviewsList);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, [database, subjectId]);
  
    return { data: reviews, loading };
};

export const useReviewedUpdatesForStudent = (studentId?: string) => {
    const database = useDatabase();
    const [reviewedUpdateIds, setReviewedUpdateIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!database || !studentId) {
            setLoading(false);
            return;
        };
        setLoading(true);

        const reviewsRef = ref(database, 'reviews');
        const q = query(reviewsRef, orderByChild('studentId'), equalTo(studentId));
        
        const unsubscribe = onValue(q, (snapshot) => {
            const reviewsData = snapshot.val();
            const ids = reviewsData ? Object.values<{updateId: string}>(reviewsData).map(review => review.updateId) : [];
            setReviewedUpdateIds(ids);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviewed updates:", error);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [database, studentId]);

    return { data: reviewedUpdateIds, loading };
}

// --- Data mutation functions ---

export const addDailyUpdate = async (update: Omit<DailyUpdate, 'id'>, database: Database) => {
    if (!database) throw new Error("Realtime Database not initialized");
    const updatesRef = ref(database, 'updates');
    const newUpdateRef = push(updatesRef);
    await set(newUpdateRef, update);
};

export const addReview = async (review: Omit<Review, 'id'>, database: Database) => {
    if (!database) throw new Error("Realtime Database not initialized");
    const reviewsRef = ref(database, 'reviews');
    const newReviewRef = push(reviewsRef);
    await set(newReviewRef, review);
};

export const clearAllReviews = async (database: Database) => {
    if (!database) throw new Error("Realtime Database not initialized");
    const reviewsRef = ref(database, 'reviews');
    await remove(reviewsRef);
};

export const getUserByRegistrationNumber = async (regNo: string, database: Database): Promise<DataSnapshot> => {
    if (!database) throw new Error("Realtime Database not initialized");
    
    // 1. Look up the UID from the public registrationNumbers mapping
    const regNoRef = ref(database, `registrationNumbers/${regNo}`);
    const regNoSnapshot = await get(regNoRef);
    
    if (!regNoSnapshot.exists()) {
        // Instead of throwing, return the empty snapshot. The caller can check .exists()
        return regNoSnapshot;
    }
    
    const { uid } = regNoSnapshot.val();

    // 2. Use the UID to get the user's private data
    const userRef = ref(database, `users/${uid}`);
    return await get(userRef);
};
