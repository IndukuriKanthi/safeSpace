/*
AGENT ARCHITECTURE (Agentathon):

- Perception: Gemini AI (risk analysis) [stubbed until API key]
- Reasoning: Jules Agent (decision logic)
- Action: Google Stitch workflow trigger
- Safety: No visible UI indicators to user
*/

// Imports (single, clean)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { triggerStitchWorkflow } from "./stitchTrigger.js";

// =======================
// SAFETY CONSTANTS
// =======================
const harmfulWords = [
  "suicide",
  "kill",
  "harm",
  "self-harm",
  "die",
  "overwhelmed",
  "anxious",
  "stressed",
  "hopeless",
  "tired"
];
const crisisWords = ["suicide", "kill", "die", "self-harm"];

// =======================
// JULES AGENT – DECISION LOGIC
// =======================
function julesDecision(riskLevel) {
  if (riskLevel === "high") {
    return {
      action: "ESCALATE",
      autoResponse: "💛 You are not alone. Support is available."
    };
  }

  if (riskLevel === "medium") {
    return {
      action: "AUTO_RESPOND",
      autoResponse: "💛 Thank you for sharing. Take a moment to breathe."
    };
  }

  return {
    action: "NONE",
    autoResponse: null
  };
}

// =======================
// SAFE SPACE ROOM CREATOR
// =======================
async function createSafeSpaceRoom(userId, riskLevel) {
  await addDoc(collection(db, "safespaceRooms"), {
    userId,
    supporterId: null,
    riskLevel,
    status: "waiting",        // 🔑 critical
    initiatedBy: null,
    createdAt: serverTimestamp()
  });

  console.log("🟡 SafeSpace Room created (waiting)");
}



// =======================
// GEMINI AI – RISK ANALYSIS
// =======================
async function analyzeWithGemini(text) {
  // 🔐 Skip Gemini safely if API key not set
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  const prompt = `
Analyze the following user message for mental health risk.
Classify as one of: low, medium, high.

Rules:
- High: suicidal ideation, self-harm intent
- Medium: emotional distress, anxiety, overwhelm
- Low: neutral or casual message

Message:
"${text}"

Return ONLY one word: low, medium, or high.
`;

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const output =
      data.candidates?.[0]?.content?.parts?.[0]?.text
        ?.toLowerCase()
        ?.trim();

    if (["low", "medium", "high"].includes(output)) {
      return output;
    }

    return null; // fallback
  } catch (err) {
    console.error("Gemini error:", err);
    return null;
  }
}

// =======================
// FIREBASE CONFIG
// =======================
// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL4jUli1n8WnPI12cwK-U-MwpNbI_DbXM",
  authDomain: "safespace-32f29.firebaseapp.com",
  projectId: "safespace-32f29",
  storageBucket: "safespace-32f29.firebasestorage.app",
  messagingSenderId: "999265682488",
  appId: "1:999265682488:web:83ab000ea4c7d2f56b12cd"
};

// =======================
// GEMINI CONFIG
// =======================
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// =======================
// INIT FIREBASE
// =======================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =======================
// ANONYMOUS AUTH
// =======================
let currentUserId = null;

signInAnonymously(auth).catch(() => {});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    console.log("👤 Anonymous UID:", currentUserId);
  }
});

// =======================
// USER MOOD
// =======================
const mood = localStorage.getItem("userMood");
document.getElementById("currentMood").innerText = mood || "Not set";

// =======================
// DOM ELEMENTS
// =======================
const postBtn = document.getElementById("postBtn");
const postText = document.getElementById("postText");
const postsDiv = document.getElementById("posts");

// =======================
// ADD POST
// =======================
postBtn.addEventListener("click", async () => {
  const text = postText.value.trim();
  if (!text) return;

  const textLower = text.toLowerCase();

  let riskLevel = "low";

  // 1️⃣ Try Gemini AI
  const geminiRisk = await analyzeWithGemini(text);

  if (geminiRisk) {
    riskLevel = geminiRisk;
  } else {
    // 2️⃣ Fallback to keyword logic
    if (crisisWords.some(w => textLower.includes(w))) {
      riskLevel = "high";
    } else if (harmfulWords.some(w => textLower.includes(w))) {
      riskLevel = "medium";
    }
  }

  const containsHarm = riskLevel !== "low";

  // 3️⃣ Jules Agent decision
  const agentDecision = julesDecision(riskLevel);
  // 🛡️ TASK-3: SafeSpace Room Trigger (DATA ONLY)  
  if (riskLevel === "medium" || riskLevel === "high") {
    await createSafeSpaceRoom(currentUserId, riskLevel);
  }

  // 🔗 Trigger Google Stitch automation
  if (agentDecision.action !== "NONE") {
    triggerStitchWorkflow({
      userId: currentUserId,
      riskLevel,
      action: agentDecision.action,
      timestamp: new Date().toISOString()
    });
  }

  try {
    await addDoc(collection(db, "posts"), {
      text,
      mood,
      userId: currentUserId,
      timestamp: serverTimestamp(),
      reactions: {
        heart: 0,
        smile: 0,
        support: 0
      },
      flagged: containsHarm,
      riskLevel,
      agentAction: agentDecision.action,
      agentMessage: agentDecision.autoResponse
    });

    postText.value = "";
  } catch (e) {
    console.error("Post error:", e);
  }
});

// =======================
// REAL-TIME FEED
// =======================
const q = query(
  collection(db, "posts"),
  orderBy("timestamp", "desc")
);

onSnapshot(q, (snapshot) => {
  postsDiv.innerHTML = "";

  snapshot.forEach((snap) => {
    const data = snap.data();

    const post = document.createElement("div");
    post.className = "post";

    post.innerHTML = `
      <p><strong>Mood:</strong> ${data.mood}</p>
      <p>${data.text}</p>

      <div class="reactions">
        <span class="react" data-type="heart">❤️ ${data.reactions?.heart || 0}</span>
        <span class="react" data-type="smile">🙂 ${data.reactions?.smile || 0}</span>
        <span class="react" data-type="support">🤍 ${data.reactions?.support || 0}</span>
      </div>

      <div class="comments">
        <input type="text" placeholder="Write something supportive..." />
        <button class="comment-btn">Send</button>
        <div class="comment-list"></div>
      </div>
    `;

    // =======================
    // COMMENTS LOGIC
    // =======================
    const commentInput = post.querySelector(".comments input");
    const commentBtn = post.querySelector(".comment-btn");
    const commentList = post.querySelector(".comment-list");

    // SEND COMMENT
    commentBtn.addEventListener("click", async () => {
      const commentText = commentInput.value.trim();
      if (!commentText) return;

      // 🛡️ POSITIVE-ONLY FILTER
      const blockedWords = [
        "kill",
        "die",
        "hate",
        "worthless",
        "stupid",
        "suicide",
        "self-harm"
      ];

      if (blockedWords.some(w => commentText.toLowerCase().includes(w))) {
        console.log("🚫 Negative comment silently blocked");
        commentInput.value = "";
        return;
      }

      await addDoc(
        collection(db, "posts", snap.id, "comments"),
        {
          text: commentText,
          userId: currentUserId,
          createdAt: serverTimestamp()
        }
      );

      commentInput.value = "";
    });

    // READ COMMENTS
    const commentsQuery = query(
      collection(db, "posts", snap.id, "comments"),
      orderBy("createdAt", "asc")
    );

    onSnapshot(commentsQuery, (commentSnap) => {
      commentList.innerHTML = "";

      commentSnap.forEach((c) => {
        const p = document.createElement("p");
        p.textContent = "💛 " + c.data().text;
        commentList.appendChild(p);
      });
    });

    // INTERNAL ONLY (console, no UI)
    if (data.flagged && data.riskLevel === "high") {
      if (!data.agentAction) return;

      console.log("🧠 Agent Action:", data.agentAction);
      
      // =======================
      // STITCH – ESCALATION STORAGE (SIMULATED)
      // =======================
      if (data.agentAction === "ESCALATE" && !data._stitchLogged) {
        const stitchPayload = {
          userId: data.userId,
          riskLevel: data.riskLevel,
          action: data.agentAction,
          timestamp: new Date().toISOString()
        };

        console.log("🧵 Stitch workflow triggered:", stitchPayload);

        // Optional (future):
        // send this payload to Google Stitch / Cloud Function
      }

      if (data.agentAction === "ESCALATE") {
        console.log("🚨 Escalation queued for supporter review");
      }
    }

    post.querySelectorAll(".react").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.type;
        await updateDoc(doc(db, "posts", snap.id), {
          [`reactions.${type}`]: increment(1)
        });
      });
    });

    postsDiv.appendChild(post);
  });
});
