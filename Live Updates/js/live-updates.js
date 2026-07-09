// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// When you get your Firebase configuration from the Firebase Console:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new Firebase project (e.g. "Bosco MUN Live").
// 3. Add a "Web App" to obtain your API credentials.
// 4. Paste the configuration object below.
// 5. Enable "Realtime Database" or "Cloud Firestore" in your Firebase console.
//
// Firebase will run in Demo Mode until you fill in the keys below.
//
// Example structure:
// const firebaseConfig = {
//   apiKey: "AIzaSyA1-XXXX-YYYY-ZZZZ",
//   authDomain: "boscomun-live.firebaseapp.com",
//   databaseURL: "https://boscomun-live-default-rtdb.firebaseio.com",
//   projectId: "boscomun-live",
//   storageBucket: "boscomun-live.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdef1234567890"
// };
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// ==========================================
// MOCK DATA (For Demo Mode fallback)
// ==========================================
const mockUpdates = [
    {
        id: "mock-1",
        title: "Cyber-Attacks Cripple Eastern European Power Grid",
        type: "crisis",
        body: "UNSC Crisis Update: A series of coordinated cyber-attacks have knocked out power grids across Eastern Europe. UNSC delegates are summoned for emergency consultation. Press conference at 12:30 PM.",
        timestamp: Date.now() - 5 * 60 * 1000 // 5 mins ago
    },
    {
        id: "mock-2",
        title: "Committee Session II Schedule Adjustment",
        type: "schedule",
        body: "Please note that Committee Session II will begin at 11:15 AM instead of 11:00 AM. Delegates are requested to be in their respective rooms 5 minutes prior.",
        timestamp: Date.now() - 35 * 60 * 1000 // 35 mins ago
    },
    {
        id: "mock-3",
        title: "Registration & Delegation Kit Collection",
        type: "announcement",
        body: "The registration desk is open in the main lobby. Schools can collect their respective delegation kits and identification badges. Desk closes at 10:00 AM.",
        timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
    }
];

// Application state
let activeFilter = "all";
let updatesList = [];
let isFirebaseConnected = false;

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    setupFilters();
    checkFirebaseConnection();
}

function checkFirebaseConnection() {
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("connection-status");
    const infoText = document.getElementById("firebase-info-text");
    const setupBox = document.getElementById("setup-instructions-box");

    // Consider configured if at least apiKey is present
    const isConfigured = firebaseConfig.apiKey && (firebaseConfig.projectId || firebaseConfig.databaseURL);

    if (isConfigured) {
        try {
            // Initialize Firebase App
            firebase.initializeApp(firebaseConfig);
            isFirebaseConnected = true;
            
            // Set styles for connected live status
            statusDot.className = "pulse-dot live";
            statusText.innerText = "LIVE (Firebase)";
            infoText.innerHTML = `Connected to Firebase project: <strong>${firebaseConfig.projectId || "Realtime DB"}</strong>. Listening for updates in real-time.`;
            setupBox.style.display = "none";
            
            // Route connection based on provided services in config
            if (firebaseConfig.databaseURL) {
                console.log("Connecting to Firebase Realtime Database...");
                connectRealtimeDB();
            } else {
                console.log("Connecting to Firebase Firestore...");
                connectFirestore();
            }
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            statusDot.className = "pulse-dot offline";
            statusText.innerText = "Connection Error";
            infoText.innerHTML = `Firebase connection failed: <code>${e.message}</code>. Defaulting to Demo Mode.`;
            loadDemoMode();
        }
    } else {
        // Run in Demo Mode with a distinct marker
        isFirebaseConnected = false;
        statusDot.className = "pulse-dot live";
        statusDot.style.backgroundColor = "#ffc107"; // Yellow warning color for demo
        statusDot.style.boxShadow = "0 0 8px #ffc107";
        statusText.innerText = "DEMO MODE";
        loadDemoMode();
    }
}

// Connect to Firebase Realtime Database
function connectRealtimeDB() {
    const dbRef = firebase.database().ref("updates");
    dbRef.orderByChild("timestamp").on("value", (snapshot) => {
        const rawData = snapshot.val();
        const loadedUpdates = [];
        
        if (rawData) {
            Object.keys(rawData).forEach(key => {
                loadedUpdates.push({
                    id: key,
                    ...rawData[key]
                });
            });
            // Sort descending by timestamp
            loadedUpdates.sort((a, b) => b.timestamp - a.timestamp);
        }
        
        updatesList = loadedUpdates;
        renderUpdates();
        updateCriticalTicker();
    }, (error) => {
        console.error("Firebase Database read failed: ", error);
        alertFirebaseError(error.message);
        loadDemoMode();
    });
}

// Connect to Firebase Cloud Firestore
function connectFirestore() {
    const db = firebase.firestore();
    db.collection("updates").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        const loadedUpdates = [];
        snapshot.forEach((doc) => {
            loadedUpdates.push({
                id: doc.id,
                ...doc.data()
            });
        });
        updatesList = loadedUpdates;
        renderUpdates();
        updateCriticalTicker();
    }, (error) => {
        console.error("Firestore read failed: ", error);
        alertFirebaseError(error.message);
        loadDemoMode();
    });
}

function alertFirebaseError(message) {
    const infoText = document.getElementById("firebase-info-text");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("connection-status");
    
    statusDot.className = "pulse-dot offline";
    statusText.innerText = "Database Error";
    infoText.innerHTML = `Database permission error: <code>${message}</code>. Check database rules. Running in Demo Mode.`;
}

// Load Demo Mode with simulated live updates
function loadDemoMode() {
    updatesList = [...mockUpdates];
    renderUpdates();
    updateCriticalTicker();

    // Simulate a live update arriving after 10 seconds to demonstrate feed responsiveness
    setTimeout(() => {
        // Prevent double insertion if user has toggled filters or page refreshed
        if (updatesList.some(item => item.id === "simulated-live-1")) return;

        const simulatedUpdate = {
            id: "simulated-live-1",
            title: "OIC Emergency Session Summoned",
            type: "crisis",
            body: "CRISIS FLASH: In response to escalating regional tensions, the Organization of Islamic Cooperation has called an emergency summit in Committee Room 4. All OIC delegates must report immediately.",
            timestamp: Date.now()
        };
        
        // Push to top of list
        updatesList.unshift(simulatedUpdate);
        renderUpdates();
        updateCriticalTicker();
        
        // Highlight the new incoming card
        const firstCard = document.querySelector(".timeline-item");
        if (firstCard) {
            firstCard.style.outline = "2px solid #ff3b30";
            firstCard.style.boxShadow = "0 0 20px rgba(255, 59, 48, 0.45)";
            setTimeout(() => {
                firstCard.style.transition = "outline 2.5s ease, box-shadow 2.5s ease";
                firstCard.style.outline = "2px solid transparent";
                firstCard.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2)";
            }, 3000);
        }
    }, 10000);
}

// Configure button filters
function setupFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            activeFilter = e.target.getAttribute("data-filter");
            renderUpdates();
        });
    });
}

// Filter and render updates timeline
function renderUpdates() {
    const timeline = document.getElementById("updates-timeline");
    const loadingSpinner = document.getElementById("loading-spinner");
    
    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }

    const filtered = updatesList.filter(item => {
        if (activeFilter === "all") return true;
        return item.type === activeFilter;
    });

    if (filtered.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <p>No updates found for category "${activeFilter}".</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = "";
    filtered.forEach((item, index) => {
        const timeString = formatTime(item.timestamp);
        
        const itemHtml = `
            <div class="timeline-item" data-id="${item.id}" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-dot ${item.type}"></div>
                <div class="timeline-card">
                    <div class="timeline-header">
                        <span class="tag ${item.type}">${item.type}</span>
                        <span class="update-time">${timeString}</span>
                    </div>
                    <h2 class="update-title">${item.title}</h2>
                    <p class="update-body">${item.body}</p>
                    ${item.imageUrl ? `<div class="update-media"><img src="${item.imageUrl}" alt="${item.title}"></div>` : ""}
                </div>
            </div>
        `;
        
        timeline.insertAdjacentHTML("beforeend", itemHtml);
    });
}

// Manage scrolling ticker content based on the latest crisis item
function updateCriticalTicker() {
    const tickerContainer = document.getElementById("critical-ticker-container");
    const tickerText = document.getElementById("critical-ticker-text");
    
    // Select the latest crisis
    const latestCrisis = updatesList.find(item => item.type === "crisis");
    
    if (latestCrisis) {
        tickerText.innerText = `${latestCrisis.title.toUpperCase()}: ${latestCrisis.body} • reporting live updates`;
        tickerContainer.style.display = "flex";
    } else {
        tickerContainer.style.display = "none";
    }
}

// Format Unix Timestamp into clean readable text
function formatTime(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                    
    if (isToday) {
        return `Today at ${hours}:${minutes} ${ampm}`;
    } else {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${hours}:${minutes} ${ampm}`;
    }
}
