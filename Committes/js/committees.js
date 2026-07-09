document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById("constellation-container");
    const svg = document.getElementById("constellation-svg");
    const centerNode = document.getElementById("node-center");
    const commNodes = document.querySelectorAll(".comm-node");
    
    if (!container || !svg || !centerNode) return;

    const urls = {
        "node-disec": "./disec.html",
        "node-unsc": "./unsc.html",
        "node-lon": "./lon.html",
        "node-wwc": "./wwc.html",
        "node-oic": "./oic.html"
    };

    let width = container.clientWidth;
    let height = container.clientHeight;
    let cx = width / 2;
    let cy = height / 2;
    let isMobile = window.innerWidth <= 768;
    let radius = 260;
    
    let centerWidth = centerNode.offsetWidth || 200;
    let centerHeight = centerNode.offsetHeight || 160;
    let nodeWidths = Array.from(commNodes).map(node => node.offsetWidth || 180);
    let nodeHeights = Array.from(commNodes).map(node => node.offsetHeight || 150);

    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseTime = Date.now();
    let isIdle = true;
    let pulses = [];
    
    let centerLogoOffsetY = getLogoOffsetY(centerNode);
    let logoOffsets = Array.from(commNodes).map(node => getLogoOffsetY(node));

    const bobConfig = {
        center: { phaseX: 0, phaseY: 1.5, speedX: 0.0012, speedY: 0.0015, ampX: 5, ampY: 7 },
        nodes: [
            { phaseX: 0.5, phaseY: 2.1, speedX: 0.0018, speedY: 0.0014, ampX: 10, ampY: 13 },
            { phaseX: 1.2, phaseY: 0.8, speedX: 0.0015, speedY: 0.0019, ampX: 13, ampY: 10 },
            { phaseX: 2.3, phaseY: 3.1, speedX: 0.0013, speedY: 0.0016, ampX: 12, ampY: 12 },
            { phaseX: 3.5, phaseY: 1.7, speedX: 0.0017, speedY: 0.0013, ampX: 11, ampY: 14 },
            { phaseX: 4.1, phaseY: 2.9, speedX: 0.0016, speedY: 0.0018, ampX: 14, ampY: 11 }
        ]
    };

    const centerState = { x: cx, y: cy, bobX: 0, bobY: 0, pullX: 0, pullY: 0 };
    const nodeStates = Array.from(commNodes).map((node, i) => ({
        x: 0, y: 0, bobX: 0, bobY: 0, pullX: 0, pullY: 0, hovered: false, element: node, index: i
    }));

    let lines = [];

    function getLogoOffsetY(node) {
        const imgWrapper = node.querySelector('.node-img-wrapper');
        if (!imgWrapper) return (node.offsetHeight || 150) / 2;
        return imgWrapper.offsetTop + imgWrapper.offsetHeight / 2;
    }

    function updateLayoutSizes() {
        width = container.clientWidth;
        height = container.clientHeight;
        cx = width / 2;
        cy = height / 2;
        isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            radius = 0;
        } else {
            radius = Math.min(width * 0.33, height * 0.35, 290);
            if (radius < 190) radius = 190;
        }
        
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        centerWidth = centerNode.offsetWidth || 200;
        centerHeight = centerNode.offsetHeight || 160;
        centerLogoOffsetY = getLogoOffsetY(centerNode);
        
        commNodes.forEach((node, i) => {
            nodeWidths[i] = node.offsetWidth || 180;
            nodeHeights[i] = node.offsetHeight || 150;
            logoOffsets[i] = getLogoOffsetY(node);
        });
    }

    function initSVGLines() {
        svg.innerHTML = '';
        lines = [];
        commNodes.forEach(() => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("class", "constellation-line");
            svg.appendChild(line);
            lines.push(line);
        });
    }

    function triggerPulse(nodeIndex) {
        const activePulseCount = pulses.filter(p => p.nodeIndex === nodeIndex).length;
        if (activePulseCount > 1) return;

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", isMobile ? "4.5" : "6.5");
        circle.setAttribute("class", "constellation-pulse-glow");
        svg.appendChild(circle);

        pulses.push({
            progress: 0,
            speed: isMobile ? 0.028 : 0.022,
            nodeIndex: nodeIndex,
            element: circle
        });
    }

    function triggerConstellationWave() {
        commNodes.forEach((_, idx) => {
            setTimeout(() => { triggerPulse(idx); }, idx * 100);
        });
    }

    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        lastMouseTime = Date.now();
        isIdle = false;
    });

    container.addEventListener("mouseleave", () => {
        mouseX = -1000;
        mouseY = -1000;
        isIdle = true;
    });

    commNodes.forEach((node, idx) => {
        node.addEventListener("click", () => {
            const url = urls[node.id];
            if (url) window.location.href = url;
        });

        node.addEventListener("mouseenter", () => {
            nodeStates[idx].hovered = true;
            if (lines[idx]) lines[idx].classList.add("active");
            triggerPulse(idx);
        });

        node.addEventListener("mouseleave", () => {
            nodeStates[idx].hovered = false;
            if (lines[idx]) lines[idx].classList.remove("active");
        });
    });

    setInterval(() => {
        if ((isIdle || Date.now() - lastMouseTime > 4000) && pulses.length < 2) {
            const randomIdx = Math.floor(Math.random() * commNodes.length);
            triggerPulse(randomIdx);
        }
    }, 3000);

    function animate(timestamp) {
        const currentWidth = container.clientWidth;
        const currentHeight = container.clientHeight;
        if (currentWidth !== width || currentHeight !== height) {
            updateLayoutSizes();
            initSVGLines();
        }

        const t = timestamp;

        centerState.bobX = Math.sin(t * bobConfig.center.speedX + bobConfig.center.phaseX) * bobConfig.center.ampX;
        centerState.bobY = Math.cos(t * bobConfig.center.speedY + bobConfig.center.phaseY) * bobConfig.center.ampY;
        
        let centerTargetPullX = 0;
        let centerTargetPullY = 0;
        if (mouseX > 0 && mouseY > 0 && !isMobile) {
            const dx = mouseX - cx;
            const dy = mouseY - cy;
            const dist = Math.hypot(dx, dy);
            if (dist < 400) {
                const strength = (1 - dist / 400) * 0.08;
                centerTargetPullX = dx * strength;
                centerTargetPullY = dy * strength;
            }
        }
        centerState.pullX += (centerTargetPullX - centerState.pullX) * 0.1;
        centerState.pullY += (centerTargetPullY - centerState.pullY) * 0.1;

        const centerFinalX = cx + centerState.bobX + centerState.pullX;
        const centerFinalY = (isMobile ? 90 : cy) + centerState.bobY + centerState.pullY;

        centerNode.style.transform = `translate3d(${centerFinalX - centerWidth / 2}px, ${centerFinalY - centerHeight / 2}px, 0)`;

        const centerLogoX = centerFinalX;
        const centerLogoY = centerFinalY - centerHeight / 2 + centerLogoOffsetY;

        nodeStates.forEach((state, i) => {
            const config = bobConfig.nodes[i];
            let defaultX = 0, defaultY = 0;

            if (isMobile) {
                const startY = 240;
                const spacing = 120;
                defaultY = startY + i * spacing;
                const staggerX = 75;
                defaultX = cx + (i % 2 === 0 ? -staggerX : staggerX);
            } else {
                const angle = (-90 + i * 72) * Math.PI / 180;
                defaultX = cx + radius * Math.cos(angle);
                defaultY = cy + radius * Math.sin(angle);
            }

            state.bobX = Math.sin(t * config.speedX + config.phaseX) * (isMobile ? 3 : config.ampX);
            state.bobY = Math.cos(t * config.speedY + config.phaseY) * (isMobile ? 4 : config.ampY);

            let targetPullX = 0, targetPullY = 0;
            const restX = defaultX + state.bobX;
            const restY = defaultY + state.bobY;

            if (mouseX > 0 && mouseY > 0) {
                const dx = mouseX - restX;
                const dy = mouseY - restY;
                const dist = Math.hypot(dx, dy);
                const pullRadius = isMobile ? 80 : 200;
                const maxPull = isMobile ? 15 : 45;

                if (dist < pullRadius) {
                    const strength = Math.pow(1 - dist / pullRadius, 1.5);
                    targetPullX = dx * strength * 0.55;
                    targetPullY = dy * strength * 0.55;
                    
                    const currentPullDist = Math.hypot(targetPullX, targetPullY);
                    if (currentPullDist > maxPull) {
                        targetPullX = (targetPullX / currentPullDist) * maxPull;
                        targetPullY = (targetPullY / currentPullDist) * maxPull;
                    }
                }
            }

            state.pullX += (targetPullX - state.pullX) * 0.12;
            state.pullY += (targetPullY - state.pullY) * 0.12;

            state.x = restX + state.pullX;
            state.y = restY + state.pullY;

            state.element.style.transform = `translate3d(${state.x - nodeWidths[i] / 2}px, ${state.y - nodeHeights[i] / 2}px, 0)`;

            const commLogoX = state.x;
            const commLogoY = state.y - nodeHeights[i] / 2 + logoOffsets[i];

            if (lines[i]) {
                lines[i].setAttribute("x1", centerLogoX);
                lines[i].setAttribute("y1", centerLogoY);
                lines[i].setAttribute("x2", commLogoX);
                lines[i].setAttribute("y2", commLogoY);
            }
        });

        pulses = pulses.filter(pulse => {
            pulse.progress += pulse.speed;
            if (pulse.progress >= 1) {
                if (pulse.element) pulse.element.remove();
                return false;
            }

            const state = nodeStates[pulse.nodeIndex];
            const startX = centerLogoX;
            const startY = centerLogoY;
            const endX = state.x;
            const endY = state.y - nodeHeights[pulse.nodeIndex] / 2 + logoOffsets[pulse.nodeIndex];

            const px = startX + (endX - startX) * pulse.progress;
            const py = startY + (endY - startY) * pulse.progress;

            if (pulse.element) {
                pulse.element.setAttribute("cx", px);
                pulse.element.setAttribute("cy", py);
            }
            return true;
        });

        requestAnimationFrame(animate);
    }

    updateLayoutSizes();
    initSVGLines();
    requestAnimationFrame(animate);

    setTimeout(() => { triggerConstellationWave(); }, 600);
});