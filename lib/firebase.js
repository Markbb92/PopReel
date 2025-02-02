import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Sign-In Function
export const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Reference to Firestore document
      const userDoc = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);
  
      // If user doesn't exist in Firestore, create a profile
      if (!userSnapshot.exists()) {
        await setDoc(userDoc, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          profilePic: user.photoURL,
          createdAt: new Date()
        });
      }
  
      return user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return null;
    }
  };

// Sign-Out Function
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};
