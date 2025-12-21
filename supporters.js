// supporters.js
// --------------------
// INTERNAL ONLY FILE
// --------------------

// Supporter email list (kept as-is)
export const supporterEmails = [
  "supporter1@example.com",
  "supporter2@example.com"
];

// ---------- FIREBASE ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// SAME config as feed.js
const firebaseConfig = {
  apiKey: "AIzaSyBL4jUli1n8WnPI12cwK-U-MwpNbI_DbXM",
  authDomain: "safespace-32f29.firebaseapp.com",
  projectId: "safespace-32f29",
  storageBucket: "safespace-32f29.firebasestorage.app",
  messagingSenderId: "999265682488",
  appId: "1:999265682488:web:83ab000ea4c7d2f56b12cd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- SUPPORTER DASHBOARD ----------
const flaggedDiv = document.getElementById("flaggedPosts");

// If supporter.html is not open → do nothing
if (flaggedDiv) {
  const roomsQuery = query(
  collection(db, "safespaceRooms"),
  where("status", "==", "open"),
  orderBy("createdAt", "desc")
);



  onSnapshot(roomsQuery, (snapshot) => {
    flaggedDiv.innerHTML = "";

    if (snapshot.empty) {
      flaggedDiv.innerHTML = "<p>No active SafeSpace rooms</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const room = docSnap.data();
      const roomId = docSnap.id;

      const card = document.createElement("div");
      card.className = "post priority-post";

      card.innerHTML = `
        <p><strong>User ID:</strong> ${room.userId}</p>
        <p><strong>Risk Level:</strong> ${room.riskLevel}</p>
         <p><strong>Status:</strong> ${room.status}</p>
        <button class="primary">Reach Out</button>
      `;

      flaggedDiv.appendChild(card);
    });
  });
}
