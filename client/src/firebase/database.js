import { db } from './config.js'; 
import { doc, setDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

export async function createUserProfile(userId, profileData) {
  try {
    await setDoc(doc(db, 'users', userId), profileData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function saveGradingResult(userId, gradingResult) {
  try {
    const gradingRef = ref(db, `gradingResults/${userId}`);
    set(gradingRef, gradingResult);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}