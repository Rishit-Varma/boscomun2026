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
});