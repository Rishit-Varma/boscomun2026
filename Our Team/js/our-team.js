document.addEventListener("DOMContentLoaded", () => {
    const devItem = document.getElementById("developer-rishit");
    if (!devItem) return;

    // Create terminal element
    const terminal = document.createElement("div");
    terminal.className = "dev-terminal-container";
    terminal.innerHTML = `
        <div class="dev-terminal-header">
            <span class="dev-terminal-title">DEV_CONSOLE</span>
            <button class="dev-terminal-close">&times;</button>
        </div>
        <div class="dev-terminal-body"></div>
    `;
    document.body.appendChild(terminal);

    const closeBtn = terminal.querySelector(".dev-terminal-close");
    const terminalBody = terminal.querySelector(".dev-terminal-body");
    let autoHideTimer = null;
    let typewriting = false;

    closeBtn.addEventListener("click", () => {
        terminal.classList.remove("active");
    });

    // Particle effect function
    function spawnParticles(x, y) {
        const symbols = ["</>", "{}", "0", "1", "code", "wizard", "*"];
        const particleCount = 24;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "dev-particle";
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            
            // Random sizing
            const size = Math.random() * 0.5 + 0.7; // 0.7rem to 1.2rem
            particle.style.fontSize = `${size}rem`;
            
            // Initial positioning
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Flight trajectory
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 120 + 60; // 60px to 180px
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 20; // slight upward drift
            const rotate = Math.random() * 360 - 180;
            
            particle.style.setProperty("--tx", `${tx}px`);
            particle.style.setProperty("--ty", `${ty}px`);
            particle.style.setProperty("--tr", `${rotate}deg`);
            
            // Random colors (gold shades / white)
            const colors = ["#d7a234", "#ebb950", "#aa7c11", "#ffffff", "#00f2fe"];
            particle.style.color = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1200);
        }
    }

    // Console typewriter sequence
    function runConsoleSequence() {
        if (typewriting) return;
        typewriting = true;

        terminalBody.innerHTML = "";
        terminal.classList.add("active");

        const lines = [
            { text: "Initializing Rishit Varma...", isPrompt: true },
            { text: "Role: Lead Website Developer", isPrompt: false },
            { text: "Status: Code Wizard", isPrompt: false },
            { text: "Coffee Level: 98% [██████████]", isPrompt: false },
            { text: "Bugs Patched: 404 Not Found", isPrompt: false },
            { text: "Easter Egg: UNLOCKED", isPrompt: false }
        ];

        let lineIdx = 0;

        function printNextLine() {
            if (lineIdx < lines.length) {
                const lineData = lines[lineIdx];
                const lineEl = document.createElement("div");
                lineEl.className = "dev-terminal-line";
                
                if (lineData.isPrompt) {
                    lineEl.innerHTML = `<span class="dev-terminal-prompt">&gt;</span> ${lineData.text}`;
                } else {
                    lineEl.innerHTML = `&nbsp;&nbsp;${lineData.text}`;
                }
                
                terminalBody.appendChild(lineEl);
                lineIdx++;
                
                // Scroll to bottom
                terminalBody.scrollTop = terminalBody.scrollHeight;
                
                setTimeout(printNextLine, 350);
            } else {
                // Add final blinking prompt
                const promptEl = document.createElement("div");
                promptEl.className = "dev-terminal-line";
                promptEl.innerHTML = `<span class="dev-terminal-prompt">boscomun2026&gt;</span> <span class="dev-terminal-blink"></span>`;
                terminalBody.appendChild(promptEl);
                
                typewriting = false;
                
                // Set auto-hide timer after completion
                clearTimeout(autoHideTimer);
                autoHideTimer = setTimeout(() => {
                    terminal.classList.remove("active");
                }, 8000);
            }
        }

        printNextLine();
    }

    devItem.addEventListener("click", (e) => {
        // Find click coordinates relative to the screen
        const rect = devItem.getBoundingClientRect();
        const clickX = rect.left + rect.width / 2;
        const clickY = rect.top + rect.height / 2;

        // Spawn interactive coding particles
        spawnParticles(clickX, clickY);

        // Run the terminal easter egg sequence
        runConsoleSequence();
    });
});