import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can obtain these details from the Firebase Console > Project settings
const firebaseConfig = {
    apiKey: "AIzaSyD8AVOcQ1hBfCv5ce5Ow9cZsuqISAThxjM",
    authDomain: "pneumonia-detection-8466e.firebaseapp.com",
    projectId: "pneumonia-detection-8466e",
    storageBucket: "pneumonia-detection-8466e.firebasestorage.app",
    messagingSenderId: "786015001639",
    appId: "1:786015001639:web:1b2ecf2c03266ac8eec202",
    measurementId: "G-LDM673LB7L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
