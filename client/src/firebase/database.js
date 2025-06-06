import { db, storage } from './config.js';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 

export async function createUserProfile(userId, profileData) {
  try {
    await setDoc(doc(db, 'users', userId), profileData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createCourse(userId, courseName) {
  try {
    const courseRef = collection(db, 'users', userId, 'courses');
    await addDoc(courseRef, {
      courseName,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Save assignment with file upload + grading result
export async function saveAssignment(userId, courseId, assignmentName, file, gradingResult) {
  try {
    const storageRef = ref(storage, `users/${userId}/courses/${courseId}/assignments/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(snapshot.ref);

    const assignmentRef = collection(db, 'users', userId, 'courses', courseId, 'assignments');
    await addDoc(assignmentRef, {
      assignmentName,
      fileUrl,
      gradingResult,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
