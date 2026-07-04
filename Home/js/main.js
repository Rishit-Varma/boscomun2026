document.addEventListener("DOMContentLoaded", function() {
    // Copy protection
    document.addEventListener("copy", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Cut protection
    document.addEventListener("cut", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Paste protection
    document.addEventListener("paste", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Right-click protection
    document.addEventListener("contextmenu", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Text selection protection
    document.addEventListener("selectstart", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Image protection
    document.querySelectorAll("img").forEach((img) => {
        img.setAttribute("draggable", false);
        img.setAttribute("loading", "eager");

        img.addEventListener("dragstart", (e) => {
            e.preventDefault();
            return false;
        });

        img.addEventListener("mousedown", (e) => {
            if (e.button === 2) { // Right click
                e.preventDefault();
                return false;
            }
        });

        img.addEventListener("copy", (e) => {
            e.preventDefault();
            return false;
        });
    });

    // Keyboard shortcuts protection
    document.addEventListener("keydown", (e) => {
        // Disable Ctrl+S (Save)
        if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            return false;
        }
        // Disable F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+Option+J (Mac) / Ctrl+Shift+J (Windows) - Console
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+Option+C (Mac) / Ctrl+Shift+C (Windows) - Element inspector
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+U / Ctrl+U - View source
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });
});