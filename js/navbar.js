let isNavbarActive = false;
const hamburgerIcon = document.getElementById("nv-hb");
const navbar = document.getElementById("mnvd");

if (hamburgerIcon && navbar) {
    hamburgerIcon.addEventListener("click", () => {
        if (!isNavbarActive) {
            // Open menu
            navbar.classList.remove("closing");
            navbar.classList.add("active");
            hamburgerIcon.classList.add("active");
            isNavbarActive = true;
        } else {
            // Close menu
            navbar.classList.remove("active");
            navbar.classList.add("closing");
            hamburgerIcon.classList.remove("active");
            isNavbarActive = false;

            // Remove closing class after animation completes
            setTimeout(() => {
                navbar.classList.remove("closing");
            }, 450);
        }
    });

    // Close menu when clicking on a link
    document.querySelectorAll(".navbar-link-anchor").forEach((link) => {
        link.addEventListener("click", () => {
            if (isNavbarActive) {
                navbar.classList.remove("active");
                navbar.classList.add("closing");
                hamburgerIcon.classList.remove("active");
                isNavbarActive = false;

                // Remove closing class after animation completes
                setTimeout(() => {
                    navbar.classList.remove("closing");
                }, 450);
            }
        });
    });

    // Close mobile navbar on window resize if it's open
    window.addEventListener("resize", () => {
        if (window.innerWidth > 850 && isNavbarActive) {
            navbar.classList.remove("active");
            navbar.classList.add("closing");
            hamburgerIcon.classList.remove("active");
            isNavbarActive = false;
 
            setTimeout(() => {
                navbar.classList.remove("closing");
            }, 450);
        }
    });
}
