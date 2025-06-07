import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyDv-NguzVR_cQhZ4CCkvpFZhv5vpCl1CUw",
  authDomain: "pregrade-86e6c.firebaseapp.com",
  projectId: "pregrade-86e6c",
  storageBucket: "pregrade-86e6c.appspot.com", 
  messagingSenderId: "192741889077",
  appId: "1:192741889077:web:f832e6fccb90baf4894d7c",
  measurementId: "G-5G7S0FC9TG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

export { auth, db, storage }; 
