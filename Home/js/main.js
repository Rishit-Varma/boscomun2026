document.addEventListener("DOMContentLoaded", function() {
    // Prevent context menu (right click) on text/images
    document.addEventListener("contextmenu", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Prevent text selection
    document.addEventListener("selectstart", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Disable image dragging, right click, and copying
    document.querySelectorAll("img").forEach((img) => {
        img.setAttribute("draggable", false);
        img.setAttribute("loading", "eager");

        img.addEventListener("dragstart", (e) => {
            e.preventDefault();
            return false;
        });

        img.addEventListener("mousedown", (e) => {
            if (e.button === 2) {
                e.preventDefault();
                return false;
            }
        });

        img.addEventListener("copy", (e) => {
            e.preventDefault();
            return false;
        });
    });

    // Prevent inspector and save keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            return false;
        }
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });

    // ==========================================
    // COUNTDOWN TIMER
    // ==========================================
    // Target date: August 3, 2026 09:00:00 (MUN Conference Start)
    // How to edit the date:
    // Simply change the text inside Date("...") below to your desired target date/time.
    // E.g., Date("August 3, 2026 09:00:00") or Date("September 15, 2026 10:00:00")
    const targetDate = new Date("August 3, 2026 09:00:00").getTime();

    function updateCountdown() {
        const now = Date.now();
        const difference = targetDate - now;

        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        // If the countdown elements are not present on the current page, stop execution
        if (!daysEl) return;

        if (difference <= 0) {
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.innerText = days < 10 ? "0" + days : days;
        hoursEl.innerText = hours < 10 ? "0" + hours : hours;
        minutesEl.innerText = minutes < 10 ? "0" + minutes : minutes;
        secondsEl.innerText = seconds < 10 ? "0" + seconds : seconds;
    }

    // Initialize and set interval for real-time updates
    updateCountdown();
    setInterval(updateCountdown, 1000);
});