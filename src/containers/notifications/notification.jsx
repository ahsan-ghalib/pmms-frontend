// Notification.jsx
"use client";
import { messaging } from "@/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useEffect } from "react";

export default function NotificationComponent() {
  async function requestPermission() {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });

      console.log("FCM Token:", token);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/device-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Assuming the frontend stores token in localStorage, you might need to append the Bearer token here
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({
            device_token: token,
            device_type: 'web'
          })
        });
        
        if (response.ok) {
          alert("Notifications enabled successfully!");
        } else {
          console.error("Failed to save token to backend.");
        }
      } catch (err) {
        console.error("Error saving token:", err);
      }
    } else {
      alert("Permission denied");
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("SW Registered", registration);
        })
        .catch((err) => console.log("SW registration failed", err));
    }

    onMessage(messaging, (payload) => {
      console.log("Foreground Message:", payload);
      alert("Foreground: " + payload.notification.title);
    });
  }, []);

  return (
    <div className="flex justify-center items-center h-[70vh] ">
      <button
        onClick={requestPermission}
        className="p-3 bg-blue-600 text-white w-[200px]"
      >
        Enable Notifications
      </button>
    </div>
  );
}
