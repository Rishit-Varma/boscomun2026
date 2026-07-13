// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZiW2H7ahlibCAMG9kO3n3CXZWkqhk3EQ",
  authDomain: "bosco-mun-bm26.firebaseapp.com",
  projectId: "bosco-mun-bm26",
  databaseURL: "https://bosco-mun-bm26-default-rtdb.asia-southeast1.firebasedatabase.app", // <-- Check your Firebase console to verify if this matches your URL
  storageBucket: "bosco-mun-bm26.firebasestorage.app",
  messagingSenderId: "574173758616",
  appId: "1:574173758616:web:2322cbcea99e33ad6dbced",
  measurementId: "G-CGC0TL8HB2"
};

let db = null;
let allUpdates = []; // Cache to hold fetched updates for filtering
let dbRef = null;
let schedulers = []; // Keep track of active timeouts for scheduled updates

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  initFirebase();

  // Refresh relative times and check for newly active scheduled updates every 30 seconds
  setInterval(() => {
    renderUpdates();
    updateCrisisTicker();
  }, 30000);
});

// Initialize Firebase and Realtime Database connection
function initFirebase() {
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus) connectionStatus.textContent = "Connecting...";

  try {
    // Check if firebase is available globally (from script tags in live-updates.html)
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      
      // Start listening to live updates
      listenToRealtimeDatabase();
    } else {
      console.warn("Firebase SDK not found globally. Starting in Demo Mode.");
      loadDemoMode("Firebase SDK not loaded");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    loadDemoMode("Config/Initialization failed");
  }
}

// Subscribe to real-time changes in the Realtime Database 'updates' node
function listenToRealtimeDatabase() {
  if (!db) return;

  const connectionStatus = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  const firebaseInfoText = document.getElementById('firebase-info-text');
  const setupInstructionsBox = document.getElementById('setup-instructions-box');
  const updatesTimeline = document.getElementById('updates-timeline');

  // Query updates ordered by timestamp
  dbRef = db.ref('updates').orderByChild('timestamp');

  dbRef.on('value', (snapshot) => {
    allUpdates = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      allUpdates.push({
        id: childSnapshot.key,
        title: data.title || '',
        body: data.body || data.content || '',
        type: data.type || 'announcement', // announcement, crisis, schedule
        timestamp: parseTimestamp(data.timestamp),
        mediaUrl: data.mediaUrl || data.image || ''
      });
    });

    // Realtime Database returns ordered items in ASCENDING order.
    // We reverse the array so that the latest updates appear at the top of the timeline.
    allUpdates.reverse();

    // Set up schedulers to automatically reveal future updates when their time arrives
    clearSchedulers();
    const nowMs = Date.now();
    allUpdates.forEach(item => {
      const timeMs = item.timestamp.getTime();
      if (timeMs > nowMs) {
        const delay = timeMs - nowMs;
        // Limit delay to 24 hours to avoid setTimeout 32-bit integer overflow
        if (delay < 86400000) {
          const timeoutId = setTimeout(() => {
            renderUpdates();
            updateCrisisTicker();
          }, delay);
          schedulers.push(timeoutId);
        }
      }
    });

    // Update Connection Status in UI
    if (connectionStatus) connectionStatus.textContent = "LIVE";
    if (statusDot) {
      statusDot.className = "pulse-dot live";
    }
    if (firebaseInfoText) {
      firebaseInfoText.innerHTML = "Successfully connected to Firebase Realtime Database! Receiving live updates.";
    }
    if (setupInstructionsBox) {
      setupInstructionsBox.style.display = "none";
    }

    // If database is empty, show a guidance card
    if (allUpdates.length === 0) {
      if (updatesTimeline) {
        updatesTimeline.innerHTML = `
          <div class="empty-state">
            <p>Connected to Realtime Database, but no updates found under the <code>updates</code> node.</p>
            <p style="margin-top: 15px; font-size: 0.9rem; color: rgba(245, 240, 225, 0.6); line-height: 1.6;">
              <strong>Next Steps:</strong> Create a node named <strong>updates</strong> in your Realtime Database console, then add a child with these keys:<br>
              <code>title</code> (String), <code>body</code> (String), <code>type</code> (String: 'announcement', 'crisis', or 'schedule'), <code>timestamp</code> (Number - epoch milliseconds, or ISO Date string), and optional <code>mediaUrl</code> (String).
            </p>
          </div>
        `;
      }
    } else {
      renderUpdates();
    }
    updateCrisisTicker();
  }, (error) => {
    console.warn("Realtime Database subscription failed, falling back to Demo Mode:", error);
    loadDemoMode("Database access denied (check rules): " + error.message);
  });
}

// Helper to clear existing timeouts
function clearSchedulers() {
  schedulers.forEach(id => clearTimeout(id));
  schedulers = [];
}

// Fallback to demo mode with local mock data
function loadDemoMode(reason) {
  const connectionStatus = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  const firebaseInfoText = document.getElementById('firebase-info-text');
  const setupInstructionsBox = document.getElementById('setup-instructions-box');

  if (connectionStatus) connectionStatus.textContent = "Demo Mode";
  if (statusDot) {
    statusDot.className = "pulse-dot offline";
  }
  if (firebaseInfoText) {
    firebaseInfoText.innerHTML = `This page is currently running in <strong>Demo Mode</strong> with mock updates. (${reason})`;
  }
  if (setupInstructionsBox) {
    setupInstructionsBox.style.display = "block";
  }

  // Populate mock data
  allUpdates = [
    {
      id: "mock-1",
      title: "Security Council Crisis Escalates",
      body: "The UN Security Council has been called to an emergency closed-door meeting to address the sudden geopolitical developments in the Mediterranean. All delegates must report to the Council Room immediately.",
      type: "crisis",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      mediaUrl: ""
    },
    {
      id: "mock-2",
      title: "Lunch Arrangements & Venue Details",
      body: "Lunch will be served from 1:00 PM to 2:15 PM in the Main Assembly Hall. Please show your delegate badges at the counter. Committee Session III will resume promptly at 2:30 PM.",
      type: "announcement",
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      mediaUrl: ""
    },
    {
      id: "mock-3",
      title: "Updated Day 1 Schedule Released",
      body: "Please note the slight adjustment in session timings. Committee Session II has been extended by 15 minutes to allow for draft resolution discussions. Check the revised timetable in the Resources section.",
      type: "schedule",
      timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
      mediaUrl: ""
    }
  ];

  renderUpdates();
  updateCrisisTicker();
}

// Custom parser to handle Indian Standard Time (IST) directly from simple strings
function parseTimestamp(val) {
  if (!val) return new Date();
  
  if (typeof val === 'number') {
    return new Date(val);
  }

  if (typeof val === 'string') {
    let str = val.trim();

    // Case 1: Just time (e.g., "09:54" or "09:54:00") -> Assume today's date in IST
    const timeOnlyRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    if (timeOnlyRegex.test(str)) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      str = `${year}-${month}-${day}T${str}+05:30`;
      return new Date(str);
    }

    // Case 2: Full date and time (e.g., "2026-07-13 09:54" or "2026-07-13 09:54:00") -> Assume IST
    if (str.includes(' ') && !str.includes('+') && !str.includes('Z')) {
      str = str.replace(' ', 'T') + '+05:30';
      return new Date(str);
    }

    // Case 3: YYYY-MM-DD format (no time, e.g., "2026-07-13") -> Start of day in IST
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyRegex.test(str)) {
      str = str + 'T00:00:00+05:30';
      return new Date(str);
    }

    // Fallback: standard date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

// Format the date/time string relative to current time
function formatTime(date) {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// Render the timeline UI based on cached data and current filter
function renderUpdates() {
  const updatesTimeline = document.getElementById('updates-timeline');
  if (!updatesTimeline) return;

  const activeBtn = document.querySelector('.filter-btn.active');
  const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

  // Filter updates (only show updates that are not in the future)
  const now = new Date();
  const filtered = allUpdates.filter(item => {
    if (item.timestamp > now) return false; // Hide future/scheduled updates
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  updatesTimeline.innerHTML = '';

  if (filtered.length === 0) {
    updatesTimeline.innerHTML = `
      <div class="empty-state">
        <p>No updates found for this category.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'timeline-item';
    
    // Determine the dot class
    let dotClass = 'timeline-dot';
    if (item.type === 'crisis') dotClass += ' crisis';
    else if (item.type === 'announcement') dotClass += ' announcement';
    else if (item.type === 'schedule') dotClass += ' schedule';

    // Tag classes and labels
    let tagClass = 'tag';
    let tagLabel = 'Announcement';
    if (item.type === 'crisis') {
      tagClass += ' crisis';
      tagLabel = 'Crisis Alert';
    } else if (item.type === 'announcement') {
      tagClass += ' announcement';
      tagLabel = 'Announcement';
    } else if (item.type === 'schedule') {
      tagClass += ' schedule';
      tagLabel = 'Schedule';
    }

    // Media HTML if present
    const mediaHtml = item.mediaUrl ? `
      <div class="update-media">
        <img src="${item.mediaUrl}" alt="${item.title}" loading="lazy">
      </div>
    ` : '';

    itemEl.innerHTML = `
      <div class="${dotClass}"></div>
      <div class="timeline-card">
        <div class="timeline-header">
          <span class="update-title">${item.title}</span>
          <span class="update-time">${formatTime(item.timestamp)}</span>
          <span class="${tagClass}">${tagLabel}</span>
        </div>
        <div class="update-body">
          <p>${item.body}</p>
        </div>
        ${mediaHtml}
      </div>
    `;
    
    updatesTimeline.appendChild(itemEl);
  });
}

// Update the horizontal scrolling marquee for active crises
function updateCrisisTicker() {
  const criticalTickerContainer = document.getElementById('critical-ticker-container');
  const criticalTickerText = document.getElementById('critical-ticker-text');
  
  if (!criticalTickerContainer || !criticalTickerText) return;

  const now = new Date();
  const crisisUpdates = allUpdates.filter(item => item.type === 'crisis' && item.timestamp <= now);

  if (crisisUpdates.length > 0) {
    criticalTickerContainer.style.display = 'flex';
    // Join multiple crisis updates with a spacer
    const tickerText = crisisUpdates.map(c => `ALERT: ${c.title} - ${c.body}`).join("  |  ");
    criticalTickerText.textContent = tickerText;
  } else {
    criticalTickerContainer.style.display = 'none';
  }
}

// Attach event listeners to filter buttons
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderUpdates();
    });
  });
}
