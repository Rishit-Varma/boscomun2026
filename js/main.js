function initLoader() {
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
            
            // Safety fallback: auto-remove loader after a maximum of 4.5 seconds to prevent freeze
            const safetyTimeout = setTimeout(() => {
                removeLoader();
            }, 4500);

            function removeLoader() {
                clearTimeout(safetyTimeout);
                loader.remove();
                document.body.classList.remove('loader-active', 'reveal-content');
                document.body.style.overflow = '';
            }

            // Step 2: Maximize logo and move it to its exact page position dynamically
            setTimeout(() => {
                loader.classList.add('logo-moving');
                
                let scale = 1;
                let deltaX = 0;
                let deltaY = 0;
                let logoCenterX = window.innerWidth / 2;
                let logoCenterY = window.innerHeight * 0.55;
                let logoRadius = 160;

                if (loaderLogo && pageLogo) {
                    // Get viewport bounds of both elements
                    const loaderRect = loaderLogo.getBoundingClientRect();
                    const pageRect = pageLogo.getBoundingClientRect();
                    
                    // Fallback to center screen if pageLogo bounds aren't ready/loaded
                    if (pageRect.width > 0 && pageRect.height > 0) {
                        deltaX = (pageRect.left + pageRect.width / 2) - (loaderRect.left + loaderRect.width / 2);
                        deltaY = (pageRect.top + pageRect.height / 2) - (loaderRect.top + loaderRect.height / 2);
                        scale = pageRect.width / loaderRect.width;
                        logoCenterX = pageRect.left + pageRect.width / 2;
                        logoCenterY = pageRect.top + pageRect.height / 2;
                        logoRadius = pageRect.width / 2;
                    } else {
                        // Safe calculations based on screen dimensions
                        logoCenterX = window.innerWidth / 2;
                        logoCenterY = window.innerHeight * 0.55;
                        logoRadius = window.innerWidth < 768 ? (window.innerWidth * 0.35) : 160;
                        scale = (logoRadius * 2) / (loaderRect.width || 230);
                        deltaX = logoCenterX - (loaderRect.left + loaderRect.width / 2);
                        deltaY = logoCenterY - (loaderRect.top + loaderRect.height / 2);
                    }
                    
                    // Set CSS variables for the exact reveal starting point
                    document.documentElement.style.setProperty('--logo-x', `${logoCenterX}px`);
                    document.documentElement.style.setProperty('--logo-y', `${logoCenterY}px`);
                    document.documentElement.style.setProperty('--logo-r', `${logoRadius}px`);
                    
                    // Trigger smooth transition
                    loaderLogo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
                }
                
                // Step 3: Shape transition starts from the center of the logo
                setTimeout(() => {
                    document.body.classList.add('reveal-content');
                    loader.classList.add('fade-out');
                    
                    // Cleanup: Remove loader element and classes after transition ends
                    setTimeout(() => {
                        removeLoader();
                    }, 1600); // Transition duration (1.6s)
                }, 1200); // Duration of the logo moving/maximizing stage
            }, 1800); // Time loader logo spends in initial pulse/loading stage
        } else {
            // Already visited in this session - skip transition completely
            loader.remove();
        }
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoader);
} else {
    initLoader();
}