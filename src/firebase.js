// firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAh3cmPz46DA8aiIwjZv2E4l7guNv1ePnw",
  authDomain: "fcm-project-f0be0.firebaseapp.com",
  projectId: "fcm-project-f0be0",
  storageBucket: "fcm-project-f0be0.firebasestorage.app",
  messagingSenderId: "197709919394",
  appId: "1:197709919394:web:865a72b063b6015c09d3fb",
  measurementId: "G-8N697M9M6J",
};

const app = initializeApp(firebaseConfig);

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;
