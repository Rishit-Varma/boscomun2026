// Determine resource path prefix based on whether page is in a subdirectory
const path = window.location.pathname.toLowerCase();
const isInSubdir = path.includes('/about/') || 
                   path.includes('/committes/') || 
                   path.includes('/committees/') || 
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

// Execute the complete loading sequence in parallel
async function loadNavbar() {
    try {
        // Start fetches in parallel
        const cssPromise = fetchResource(config.cssPath, "CSS").catch(err => {
            console.warn("Proceeding without navbar styles", err);
            return null;
        });
        const htmlPromise = fetchResource(config.htmlPath, "HTML");
        const jsPromise = fetchResource(config.jsPath, "JavaScript").catch(err => {
            console.warn("Proceeding without navbar script behavior", err);
            return null;
        });

        // Wait for all fetches to resolve
        const [cssText, htmlText, jsText] = await Promise.all([cssPromise, htmlPromise, jsPromise]);

        // 1. Inject CSS
        if (cssText) {
            const style = document.createElement("style");
            style.textContent = cssText;
            document.head.appendChild(style);
        }

        // 2. Inject HTML
        const container = document.getElementById(config.containerId);
        if (!container) {
            throw new Error(`Navigation container #${config.containerId} not found on page`);
        }
        let htmlContent = htmlText;
        if (!isInSubdir) {
            htmlContent = htmlContent.replace(/(src|href)="\.\.\//g, '$1="./');
        }
        container.innerHTML = htmlContent;
        processInlineScripts(container);

        // 3. Inject JS
        if (jsText) {
            const script = document.createElement("script");
            script.textContent = jsText;
            document.body.appendChild(script);
        }

        console.log("Navbar loaded completely");
    } catch (error) {
        console.error("Navbar loading sequence failed:", error);
        const container = document.getElementById(config.containerId);
        if (container) {
            container.innerHTML = `
                <div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; text-align: center;">
                    Navigation could not be loaded. Please try refreshing the page.
                </div>
            `;
        }
    }
}

// Start the loading process
loadNavbar();
function initProtectionsAndCursor() {
    // Initialize native device pixel ratio baseline if not already stored
    try {
        let nativeDpr = parseFloat(sessionStorage.getItem('native-device-pixel-ratio'));
        if (isNaN(nativeDpr)) {
            const initialZoom = window.outerWidth / window.innerWidth;
            if (Math.abs(initialZoom - 1.0) > 0.01) {
                nativeDpr = window.devicePixelRatio / initialZoom;
            } else {
                nativeDpr = window.devicePixelRatio;
            }
            sessionStorage.setItem('native-device-pixel-ratio', nativeDpr);
        }
    } catch (e) {
        console.warn('sessionStorage not available for native DPR:', e);
    }

    // Zoom control & prevention logic
    const blockZoom = () => {
        // Prevent key combinations (Ctrl + +/-), allow Ctrl + 0 to reset zoom
        document.addEventListener('keydown', (e) => {
            const isZoomKey = (
                (e.ctrlKey || e.metaKey) && 
                (e.key === '+' || e.key === '-' || e.key === '=' || e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 107 || e.keyCode === 109)
            );
            if (isZoomKey) {
                e.preventDefault();
                return false;
            }

            // Capture Ctrl+0 / Cmd+0 to update baseline zoom
            if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.keyCode === 48 || e.keyCode === 96)) {
                setTimeout(() => {
                    try {
                        sessionStorage.setItem('native-device-pixel-ratio', window.devicePixelRatio);
                        checkZoomLevel();
                    } catch (err) {}
                }, 150);
            }
        });

        // Prevent wheel zoom (Ctrl + mouse wheel)
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        }, { passive: false });
    };

    const checkZoomLevel = () => {
        if (!window.matchMedia("(pointer: fine)").matches) return;

        // Check if user dismissed warning in this session
        try {
            if (sessionStorage.getItem('zoom-warning-dismissed') === 'true') {
                const warningBanner = document.getElementById('zoom-warning-banner');
                if (warningBanner) {
                    warningBanner.remove();
                }
                return;
            }
        } catch (e) {
            console.warn('sessionStorage not available:', e);
        }

        // If devicePixelRatio is exactly 1.0, they must be at 100% zoom, so we can correct the baseline
        if (window.devicePixelRatio === 1.0) {
            try {
                sessionStorage.setItem('native-device-pixel-ratio', '1.0');
            } catch (e) {}
        }

        // Compare total window width to internal viewport width (excludes scrollbars roughly, so we use a margin of error)
        let zoomFactor = window.outerWidth / window.innerWidth;

        // Fallback for Brave with Shields active (where outerWidth is spoofed to equal innerWidth)
        try {
            const nativeDpr = parseFloat(sessionStorage.getItem('native-device-pixel-ratio'));
            if (Math.abs(zoomFactor - 1.0) < 0.01 && nativeDpr) {
                zoomFactor = window.devicePixelRatio / nativeDpr;
            }
        } catch (e) {}

        let warningBanner = document.getElementById('zoom-warning-banner');

        // Check if browser zoom is deviated by more than 15% from 100%
        if (zoomFactor < 0.85 || zoomFactor > 1.15) {
            if (!warningBanner) {
                warningBanner = document.createElement('div');
                warningBanner.id = 'zoom-warning-banner';
                warningBanner.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; background: rgba(215, 162, 52, 0.98); color: #0b0d10; text-align: center; padding: 10px 24px; font-family: 'Space Grotesk', sans-serif; font-size: clamp(0.85rem, 2vw, 1rem); font-weight: 700; z-index: 1000000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; gap: 15px; border-bottom: 2px solid #0b0d10; backdrop-filter: blur(8px); animation: slideDown 0.3s ease-out;">
                        <span style="letter-spacing: 0.02em;">⚠️ Browser zoom detected at ${Math.round(zoomFactor * 100)}%. For the best visual experience, please reset zoom to 100% (Press Ctrl + 0 or Cmd + 0).</span>
                        <button onclick="try { sessionStorage.setItem('zoom-warning-dismissed', 'true'); } catch (e) {} this.parentElement.parentElement.remove();" style="background: #0b0d10; color: #d7a234; border: 1px solid rgba(215, 162, 52, 0.3); border-radius: 4px; padding: 4px 12px; cursor: pointer; font-weight: 700; font-family: inherit; font-size: 0.85rem; transition: background 0.2s;">Dismiss</button>
                    </div>
                    <style>
                        @keyframes slideDown {
                            from { transform: translateY(-100%); }
                            to { transform: translateY(0); }
                        }
                    </style>
                `;
                document.body.appendChild(warningBanner);
            } else {
                const textSpan = warningBanner.querySelector('span');
                if (textSpan) {
                    textSpan.textContent = `⚠️ Browser zoom detected at ${Math.round(zoomFactor * 100)}%. For the best visual experience, please reset zoom to 100% (Press Ctrl + 0 or Cmd + 0).`;
                }
            }
        } else {
            if (warningBanner) {
                warningBanner.remove();
            }
        }
    };

    blockZoom();
    checkZoomLevel();
    window.addEventListener('resize', checkZoomLevel);

    // Copy protection
    document.addEventListener("copy", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Cut protection
    document.addEventListener("cut", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Paste protection
    document.addEventListener("paste", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Right-click protection
    document.addEventListener("contextmenu", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return true;
        }
        e.preventDefault();
        return false;
    });

    // Text selection protection
    document.addEventListener("selectstart", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
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

    // Custom Gavel Cursor Implementation (using gold gavel.avif)
    if (window.matchMedia("(pointer: fine)").matches) {
        const cursor = document.createElement("div");
        cursor.className = "custom-cursor";
        document.body.appendChild(cursor);

        const style = document.createElement("style");
        style.textContent = `
            .custom-cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 48px;
                height: 48px;
                background: url('${prefix}images/gold%20gavel.png') no-repeat center center;
                background-size: contain;
                pointer-events: none;
                z-index: 10000001;
                transform: translate3d(var(--x, -100px), var(--y, -100px), 0) translate(-25%, -25%) scale(var(--scale, 1)) rotate(var(--rotate, 0deg));
                transform-origin: 25% 25%;
                transition: transform 0.08s cubic-bezier(0.25, 1, 0.5, 1);
                will-change: transform;
                display: none;
            }
            .custom-cursor.clicking {
                --scale: 1.2;
                --rotate: -20deg;
            }
            @media (pointer: fine) {
                .has-custom-cursor,
                .has-custom-cursor a,
                .has-custom-cursor button,
                .has-custom-cursor select,
                .has-custom-cursor [role="button"],
                .has-custom-cursor .register-item,
                .has-custom-cursor .committee-emblem-card,
                .has-custom-cursor .file-card {
                    cursor: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        let cursorVisible = false;
        let mouseX = 0;
        let mouseY = 0;
        let ticking = false;

        document.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Check if hovering over input, textarea, select or contenteditable
            const target = e.target;
            const isInputField = target && (
                target.tagName === "INPUT" || 
                target.tagName === "TEXTAREA" || 
                target.tagName === "SELECT" ||
                target.isContentEditable ||
                target.closest("input") ||
                target.closest("textarea") ||
                target.closest("select")
            );

            if (isInputField) {
                cursor.style.display = "none";
                cursorVisible = false;
                document.body.classList.remove('has-custom-cursor');
            } else {
                if (!cursorVisible) {
                    // Set coordinates immediately before displaying to prevent top-left slide glitch
                    cursor.style.transition = "none";
                    cursor.style.setProperty('--x', `${mouseX}px`);
                    cursor.style.setProperty('--y', `${mouseY}px`);
                    cursor.style.display = "block";
                    
                    // Force browser reflow to apply coordinates instantly
                    cursor.offsetHeight;
                    
                    // Restore transitions for subsequent moves
                    window.requestAnimationFrame(() => {
                        cursor.style.transition = "";
                    });
                    cursorVisible = true;
                }
                document.body.classList.add('has-custom-cursor');
            }

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Only set properties if cursor is visible to avoid overwriting initial placement
                    if (cursorVisible) {
                        cursor.style.setProperty('--x', `${mouseX}px`);
                        cursor.style.setProperty('--y', `${mouseY}px`);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        const hideCursor = () => {
            cursor.style.display = "none";
            cursorVisible = false;
            document.body.classList.remove('has-custom-cursor');
        };

        document.addEventListener("mouseleave", hideCursor);
        document.documentElement.addEventListener("mouseleave", hideCursor);
        
        document.addEventListener("mouseout", (e) => {
            // Hide if mouse leaves viewport entirely or enters an iframe
            if (!e.relatedTarget || e.relatedTarget.nodeName === "HTML" || e.relatedTarget.nodeName === "IFRAME") {
                hideCursor();
            }
        });

        window.addEventListener("blur", hideCursor);

        // Auto-hide custom cursor when mouse enters any iframe on the page (e.g. Google Maps, Google Drive)
        const attachIframeListeners = () => {
            document.querySelectorAll("iframe").forEach(iframe => {
                if (iframe.dataset.cursorListenerAttached) return;
                iframe.dataset.cursorListenerAttached = "true";
                iframe.addEventListener("mouseenter", hideCursor);
            });
        };

        // Attach listeners initially and on page load completion
        attachIframeListeners();
        window.addEventListener("load", attachIframeListeners);

        // Monitor dynamically added iframes (like the PDF preview iframe in Resources)
        if (window.MutationObserver) {
            const iframeObserver = new MutationObserver(() => {
                attachIframeListeners();
            });
            iframeObserver.observe(document.documentElement, { childList: true, subtree: true });
        }

        document.addEventListener("mousedown", () => {
            cursor.classList.add("clicking");
        });

        document.addEventListener("mouseup", () => {
            cursor.classList.remove("clicking");
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProtectionsAndCursor);
} else {
    initProtectionsAndCursor();
}
