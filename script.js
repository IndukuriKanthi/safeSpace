// Firebase imports (MODULE STYLE)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config (PASTED FROM FIREBASE)
const firebaseConfig = {
  apiKey: "AIzaSyCjszAKobObSencoB6xfRm8vKSgTh9lE6w",
  authDomain: "safespace-e4b6b.firebaseapp.com",
  projectId: "safespace-e4b6b",
  storageBucket: "safespace-e4b6b.firebasestorage.app",
  messagingSenderId: "130138741370",
  appId: "1:130138741370:web:0ed3dee0ac4486cf5639c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Anonymous Auth
const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => {
    console.log("User signed in anonymously");
  })
  .catch((error) => {
    console.error(error);
  });

window.selectMood = function (mood) {
  localStorage.setItem("userMood", mood);
  window.location.href = "feed.html";
};