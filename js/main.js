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

    // Intro Loader Shape Transition Session Check
    const loader = document.getElementById('intro-loader');
    if (loader) {
        if (!sessionStorage.getItem('visited')) {
            // First time in session - show transition
            sessionStorage.setItem('visited', 'true');
            document.body.classList.add('loader-active');
            document.body.style.overflow = 'hidden';
            
            const loaderLogo = loader.querySelector('.intro-loader-logo');
            const pageLogo = document.querySelector('.center-logo');
            
            // Step 2: Maximize logo and move it to its exact page position dynamically
            setTimeout(() => {
                loader.classList.add('logo-moving');
                
                if (loaderLogo && pageLogo) {
                    // Get viewport bounds of both elements
                    const loaderRect = loaderLogo.getBoundingClientRect();
                    const pageRect = pageLogo.getBoundingClientRect();
                    
                    // Calculate pixel deltas from current screen center
                    const deltaX = (pageRect.left + pageRect.width / 2) - (loaderRect.left + loaderRect.width / 2);
                    const deltaY = (pageRect.top + pageRect.height / 2) - (loaderRect.top + loaderRect.height / 2);
                    
                    // Calculate precise scale multiplier to match sizes
                    const scale = pageRect.width / loaderRect.width;
                    
                    // Set CSS variables for the exact reveal starting point
                    const logoCenterX = pageRect.left + pageRect.width / 2;
                    const logoCenterY = pageRect.top + pageRect.height / 2;
                    document.documentElement.style.setProperty('--logo-x', `${logoCenterX}px`);
                    document.documentElement.style.setProperty('--logo-y', `${logoCenterY}px`);
                    
                    // Trigger smooth transition
                    loaderLogo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
                }
                
                // Step 3: Shape transition starts from the center of the logo
                setTimeout(() => {
                    document.body.classList.add('reveal-content');
                    loader.classList.add('fade-out');
                    
                    // Cleanup: Remove loader element and classes after transition ends
                    setTimeout(() => {
                        loader.remove();
                        document.body.classList.remove('loader-active', 'reveal-content');
                        document.body.style.overflow = '';
                    }, 1600); // Transition duration (1.6s)
                }, 1200); // Duration of the logo moving/maximizing stage
            }, 1800); // Time loader logo spends in initial pulse/loading stage
        } else {
            // Already visited in this session - skip transition completely
            loader.remove();
        }
    }
});