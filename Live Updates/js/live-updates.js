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
        mediaUrl: data.mediaUrl || data.image || '',
        committee: data.committee ? data.committee.toLowerCase() : 'general'
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

    // Determine if feed is active
    const countdownTarget = new Date("August 3, 2026 09:00:00").getTime();
    const countdownHitZero = Date.now() >= countdownTarget;
    const now = new Date();
    const visibleUpdates = allUpdates.filter(item => item.timestamp <= now);
    const isFeedActive = visibleUpdates.length > 0 || countdownHitZero;

    // Update Connection Status in UI
    if (connectionStatus) {
      connectionStatus.textContent = isFeedActive ? "LIVE" : "Offline";
    }
    if (statusDot) {
      statusDot.className = isFeedActive ? "pulse-dot live" : "pulse-dot offline";
    }
    if (firebaseInfoText) {
      firebaseInfoText.innerHTML = isFeedActive
        ? "Successfully connected to Firebase Realtime Database! Receiving live updates."
        : "Successfully connected to Firebase Realtime Database! Updates are offline until conference starts.";
    }
    if (setupInstructionsBox) {
      setupInstructionsBox.style.display = "none";
    }

    // If database is empty and feed is active, show the instructions
    if (allUpdates.length === 0 && isFeedActive) {
      if (updatesTimeline) {
        updatesTimeline.innerHTML = `
          <div class="empty-state">
            <p>Connected to Realtime Database, but no updates found under the <code>updates</code> node.</p>
            <p style="margin-top: 15px; font-size: 0.9rem; color: rgba(245, 240, 225, 0.6); line-height: 1.6;">
              <strong>Next Steps:</strong> Create a node named <strong>updates</strong> in your Realtime Database console, then add a child with these keys:<br>
              <code>title</code> (String), <code>body</code> (String), <code>type</code> (String: 'announcement', 'crisis', or 'schedule'), <code>timestamp</code> (Number - epoch milliseconds, or ISO Date string), <code>committee</code> (String: 'general', 'unsc', 'disec', 'lon', 'wwc', 'oic'), and optional <code>mediaUrl</code> (String).
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
// Fallback to demo mode with local mock data
function loadDemoMode(reason) {
  const connectionStatus = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  const firebaseInfoText = document.getElementById('firebase-info-text');
  const setupInstructionsBox = document.getElementById('setup-instructions-box');

  // Populate mock data
  allUpdates = [
    {
      id: "mock-1",
      title: "Security Council Crisis Escalates",
      body: "The UN Security Council has been called to an emergency closed-door meeting to address the sudden geopolitical developments in the Mediterranean. All delegates must report to the Council Room immediately.",
      type: "crisis",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      mediaUrl: "",
      committee: "unsc"
    },
    {
      id: "mock-2",
      title: "Lunch Arrangements & Venue Details",
      body: "Lunch will be served from 1:00 PM to 2:15 PM in the Main Assembly Hall. Please show your delegate badges at the counter. Committee Session III will resume promptly at 2:30 PM.",
      type: "announcement",
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      mediaUrl: "",
      committee: "general"
    },
    {
      id: "mock-3",
      title: "Updated Day 1 Schedule Released",
      body: "Please note the slight adjustment in session timings. Committee Session II has been extended by 15 minutes to allow for draft resolution discussions. Check the revised timetable in the Resources section.",
      type: "schedule",
      timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
      mediaUrl: "",
      committee: "general"
    },
    {
      id: "mock-4",
      title: "DISEC Draft Resolution Deadline",
      body: "All draft resolutions for DISEC must be submitted to the dais by 4:00 PM today. Late submissions will not be entertained.",
      type: "announcement",
      timestamp: new Date(Date.now() - 150 * 60 * 1000),
      mediaUrl: "",
      committee: "disec"
    },
    {
      id: "mock-5",
      title: "League of Nations Territory Disputes",
      body: "A sudden border dispute has erupted in the Rhineland, requiring immediate League intervention. Delegates, prepare your arguments.",
      type: "crisis",
      timestamp: new Date(Date.now() - 180 * 60 * 1000),
      mediaUrl: "",
      committee: "lon"
    },
    {
      id: "mock-6",
      title: "WWC Strategic Directives",
      body: "Wilhelm's War Cabinet is reviewing diplomatic messages from foreign allies. A response must be finalized by the end of this session.",
      type: "announcement",
      timestamp: new Date(Date.now() - 210 * 60 * 1000),
      mediaUrl: "",
      committee: "wwc"
    },
    {
      id: "mock-7",
      title: "OIC Resolving Regional Crisis",
      body: "The Organisation of Islamic Conference has initiated a debate on humanitarian support in conflict zones.",
      type: "announcement",
      timestamp: new Date(Date.now() - 240 * 60 * 1000),
      mediaUrl: "",
      committee: "oic"
    }
  ];

  // Calculate if active based on mock data & target date countdown
  const countdownTarget = new Date("August 3, 2026 09:00:00").getTime();
  const countdownHitZero = Date.now() >= countdownTarget;
  const now = new Date();
  const visibleUpdates = allUpdates.filter(item => item.timestamp <= now);
  const isFeedActive = visibleUpdates.length > 0 || countdownHitZero;

  if (connectionStatus) {
    connectionStatus.textContent = isFeedActive ? "Demo Mode" : "Offline";
  }
  if (statusDot) {
    statusDot.className = isFeedActive ? "pulse-dot live" : "pulse-dot offline";
  }
  if (firebaseInfoText) {
    firebaseInfoText.innerHTML = `This page is currently running in <strong>Demo Mode</strong> with mock updates. (${reason})`;
  }
  if (setupInstructionsBox) {
    setupInstructionsBox.style.display = "block";
  }

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

// Helper to parse and render media (images, YouTube embeds, Google Drive previews, direct videos)
function getMediaHtml(item) {
  if (!item.mediaUrl) return '';

  const url = item.mediaUrl.trim();

  // YouTube Video detection
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `
      <div class="update-media video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border: 1px solid rgba(242, 193, 86, 0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-top: 12px;">
        <iframe src="https://www.youtube.com/embed/${videoId}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
      </div>
    `;
  }

  // Google Drive Video detection
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegex);
  if (driveMatch) {
    const fileId = driveMatch[1];
    return `
      <div class="update-media video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border: 1px solid rgba(242, 193, 86, 0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-top: 12px;">
        <iframe src="https://drive.google.com/file/d/${fileId}/preview" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                allow="autoplay">
        </iframe>
      </div>
    `;
  }

  // Direct Video files (.mp4, .webm, .ogg)
  const directVideoRegex = /\.(mp4|webm|ogg)(?:\?.*)?$/i;
  if (directVideoRegex.test(url)) {
    const format = url.match(directVideoRegex)[1];
    return `
      <div class="update-media" style="margin-top: 12px;">
        <video controls style="width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid rgba(242, 193, 86, 0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.3); outline: none;">
          <source src="${url}" type="video/${format}">
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  }

  // Fallback to standard Image
  return `
    <div class="update-media" style="margin-top: 12px;">
      <img src="${url}" alt="${item.title}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; border: 1px solid rgba(242, 193, 86, 0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
    </div>
  `;
}

// Render the timeline UI based on cached data and current filter
function renderUpdates() {
  const updatesTimeline = document.getElementById('updates-timeline');
  if (!updatesTimeline) return;

  const activeBtn = document.querySelector('.filter-btn.active');
  const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

  // Filter updates (only show updates that are not in the future)
  const now = new Date();
  const visibleUpdates = allUpdates.filter(item => item.timestamp <= now);

  // Check if countdown hits zero (August 3, 2026 09:00:00)
  const countdownTarget = new Date("August 3, 2026 09:00:00").getTime();
  const countdownHitZero = Date.now() >= countdownTarget;

  // Active if at least one update is published OR countdown hit zero
  const isFeedActive = visibleUpdates.length > 0 || countdownHitZero;

  // Update Status Indicator in UI
  const connectionStatus = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  if (connectionStatus && statusDot) {
    if (isFeedActive) {
      if (connectionStatus.textContent === "Offline" || connectionStatus.textContent === "Connecting..." || connectionStatus.textContent === "Initializing...") {
        connectionStatus.textContent = "LIVE";
      }
      statusDot.className = "pulse-dot live";
    } else {
      connectionStatus.textContent = "Offline";
      statusDot.className = "pulse-dot offline";
    }
  }

  updatesTimeline.innerHTML = '';

  // If feed is not active, show 'Coming Soon'
  if (!isFeedActive) {
    updatesTimeline.innerHTML = `
      <div class="empty-state coming-soon" style="text-align: center; padding: 3rem 1.5rem; background: rgba(26, 26, 26, 0.5); border: 1px dashed rgba(242, 193, 86, 0.25); border-radius: 12px; margin-top: 1rem;">
        <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 2.2rem; color: rgba(242, 193, 86, 0.95); margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Coming Soon</h2>
      </div>
    `;
    return;
  }

  // Filter the visible updates based on selected committee button
  const filtered = visibleUpdates.filter(item => {
    if (filterType === 'all') return true;
    return (item.committee || 'general').toLowerCase() === filterType;
  });

  if (filtered.length === 0) {
    updatesTimeline.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 2rem;">
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

    // Committee tag classes and labels
    let committeeTagClass = 'tag committee-tag';
    let committeeTagLabel = 'General';
    const comm = (item.committee || 'general').toLowerCase();
    if (comm === 'unsc') {
      committeeTagClass += ' unsc';
      committeeTagLabel = 'UNSC';
    } else if (comm === 'disec') {
      committeeTagClass += ' disec';
      committeeTagLabel = 'DISEC';
    } else if (comm === 'lon') {
      committeeTagClass += ' lon';
      committeeTagLabel = 'LON';
    } else if (comm === 'wwc') {
      committeeTagClass += ' wwc';
      committeeTagLabel = 'WWC';
    } else if (comm === 'oic') {
      committeeTagClass += ' oic';
      committeeTagLabel = 'OIC';
    } else {
      committeeTagClass += ' general';
      committeeTagLabel = 'General';
    }

    // Media HTML if present (supporting video iframes, direct files, or images)
    const mediaHtml = getMediaHtml(item);

    itemEl.innerHTML = `
      <div class="${dotClass}"></div>
      <div class="timeline-card">
        <div class="timeline-header">
          <span class="update-title">${item.title}</span>
          <span class="update-time">${formatTime(item.timestamp)}</span>
          <div class="tag-group" style="display: flex; gap: 6px;">
            <span class="${tagClass}">${tagLabel}</span>
            <span class="${committeeTagClass}">${committeeTagLabel}</span>
          </div>
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
