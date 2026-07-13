// Clean .html extension from address bar
try {
    if (window.location.pathname.toLowerCase().endsWith('.html')) {
        const cleanPath = window.location.pathname.substring(0, window.location.pathname.length - 5);
        window.history.replaceState(null, document.title, cleanPath + window.location.search + window.location.hash);
    }
} catch (e) {
    console.warn("Failed to clean URL extension:", e);
}

// Determine resource path prefix based on whether page is in a subdirectory
const path = window.location.pathname.toLowerCase();
const isInSubdir = path.includes('/about/') || 
                   path.includes('/committes/') || 
                   path.includes('/our team/') || 
                   path.includes('/our%20team/') || 
                   path.includes('/resources/') ||
                   path.includes('/live updates/') ||
                   path.includes('/live%20updates/') ||
                   path.includes('/home/');
const prefix = isInSubdir ? "../" : "./";

// Unregister any active service worker to prevent redirect loops or routing conflicts
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister().then(function(success) {
                if (success) {
                    console.log('Service Worker unregistered successfully');
                }
            });
        }
    }).catch(function(err) {
        console.warn('Failed to unregister Service Worker:', err);
    });
}

const config = {
    htmlPath: prefix + "partials/navbar.html",
    cssPath: prefix + "css/navbar.css",
    jsPath: prefix + "js/navbar.js",
    containerId: "navigation-container",
};

// Helper function for fetch operations
async function fetchResource(url, resourceType) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Failed to load ${resourceType}: ${response.status} ${response.statusText}`
            );
        }

        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${resourceType}:`, error);
        throw error; // Re-throw to handle in the calling function
    }
}

// Load and apply CSS
async function loadCSS() {
    try {
        const cssText = await fetchResource(config.cssPath, "CSS");
        const style = document.createElement("style");
        style.textContent = cssText;
        document.head.appendChild(style);
        console.log("Navbar CSS loaded successfully");
    } catch (error) {
        console.warn("Proceeding without navbar styles");
        // Non-fatal error, continue with loading HTML
    }
}

// Load and process HTML with inline scripts
async function loadHTML() {
    try {
        const container = document.getElementById(config.containerId);

        if (!container) {
            throw new Error(
                `Navigation container #${config.containerId} not found on page`
            );
        }

        let htmlContent = await fetchResource(config.htmlPath, "HTML");
        if (!isInSubdir) {
            htmlContent = htmlContent.replace(/(src|href)="\.\.\//g, '$1="./');
        }
        container.innerHTML = htmlContent;

        // Process any inline scripts that came with the HTML
        processInlineScripts(container);
        console.log("Navbar HTML loaded successfully");
    } catch (error) {
        console.error("Failed to load navbar HTML:", error);

        // Add visible error state for users
        const container = document.getElementById(config.containerId);
        if (container) {
            container.innerHTML = `
          <div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">
            Navigation could not be loaded. Please try refreshing the page.
          </div>
        `;
        }
        throw error; // Re-throw to stop the sequence
    }
}

// Process inline scripts from the fetched HTML
function processInlineScripts(container) {
    const scripts = container.querySelectorAll("script");
    scripts.forEach((script) => {
        const newScript = document.createElement("script");

        // Copy all attributes
        Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
        });

        // Copy content if any
        if (script.innerHTML) {
            newScript.appendChild(document.createTextNode(script.innerHTML));
        }

        // Replace the original script tag
        script.parentNode.replaceChild(newScript, script);
    });
}

// Load and execute JS
async function loadJS() {
    try {
        const jsContent = await fetchResource(config.jsPath, "JavaScript");
        const script = document.createElement("script");
        script.textContent = jsContent;
        document.body.appendChild(script);
        console.log("Navbar JS loaded successfully");
    } catch (error) {
        console.error("Failed to load navbar JavaScript:", error);
        // JS failure is non-fatal if HTML/CSS are already loaded
    }
}

// Execute the complete loading sequence
async function loadNavbar() {
    try {
        // Sequential loading for proper dependencies
        await loadCSS(); // First load styles
        await loadHTML(); // Then load structure
        await loadJS(); // Finally load behavior
        console.log("Navbar loaded completely");
    } catch (error) {
        console.error("Navbar loading sequence failed:", error);
    }
}

// Start the loading process
loadNavbar();
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
            if (e.button === 2) {
                // Right click
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
