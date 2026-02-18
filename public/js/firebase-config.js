// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3BPjnb7LWqj_4q_bATn3EZbPrJlZ9ykw",
    authDomain: "secondsemdashb.firebaseapp.com",
    projectId: "secondsemdashb",
    storageBucket: "secondsemdashb.firebasestorage.app",
    messagingSenderId: "618979877762",
    appId: "1:618979877762:web:67f9c8ca08cfedf150a59b",
    measurementId: "G-31SE5RGH85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized successfully");

export { db };
