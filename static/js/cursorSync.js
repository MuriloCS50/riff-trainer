// This file makes the tablature cursor work in sync with the audio

window.addEventListener("load", () => {

        let cursorPB = document.querySelector(".playback-cursor");
        let isPlaying = false;

        const container = document.querySelector(".tab-container");
        const tabElement = document.querySelector("#notation");

        // Initial cursor position and tab dimensions
        let startX, startY, tabWidth, endX, staveMap, staveGap;

        function initCursor() {
            // Ensures the cursor is positioned correctly relative to the tab, even on window resize
            if (container && tabElement) {
            const containerRect = container.getBoundingClientRect();
            const rect = tabElement.getBoundingClientRect();


            startX = rect.left - containerRect.left + 50;
            startY = rect.top - containerRect.top + 77;

            // Defines the allowed position for cursor
            tabWidth = tabElement.clientWidth - 70;
            endX = startX + tabWidth;


            // store Y positions of staves and the total of staves in an array of objects
            const staves = document.querySelectorAll("#notation svg .vf-stave")
            staveMap = Array.from(staves).map((stave, index) => {
                const staveRect = stave.getBoundingClientRect();
                return {
                    index: index,
                    yPos: staveRect.top - containerRect.top,
                }
            });

            // Reset cursor position
            setCursorPosition(startX, startY);
        }
    }

        function waitForTab() {
            const staves = document.querySelectorAll("#notation svg .vf-stave");

            if (staves.length === 0 || tabElement.clientWidth === 0) {
                requestAnimationFrame(waitForTab);
                return;
            }

            initCursor();
        }

        waitForTab(); // Initial calculation

        // Recalculate on window resize
        window.addEventListener('resize', initCursor);

        // Get x and y position of the cursor based on the current time of the audio
        function timeToXY(currentTime) {
            const totalTime = window.totalPreviewTime || 0;
            const totalStaves = staveMap?.length || 0;

            if (!staveMap || totalStaves === 0 || totalTime <= 0) {
                return { x: startX, y: startY };
            }

            const normalizedTime = currentTime % totalTime;

            if (totalStaves === 1) {
                const progress = normalizedTime / totalTime;
                const x = Math.round(startX + progress * tabWidth);
                return { x, y: startY };
            }

            const lineDuration = totalTime / totalStaves;
            const currentLineTime = normalizedTime % lineDuration;
            const currentLineIndex = Math.floor(normalizedTime / lineDuration) % totalStaves;

            // Calculate the gap between staves using the first two staves in the staveMap
            staveGap = staveMap[1].yPos - staveMap[0].yPos;

            const y = startY + staveGap * currentLineIndex;
            const progress = currentLineTime / lineDuration;
            const x = Math.round(startX + progress * tabWidth);
            return { x, y };
        }

        let animationId;

        function setCursorPosition(x, y) {
            cursorPB.style.left = `${x}px`;
            cursorPB.style.top = `${y}px`;
        }

        function updateCursor() {
            if (!isPlaying) {
                return;
            } 

            let currentTime = Tone.Transport.seconds;

            if (window.loopEnabled) {
                currentTime = currentTime % window.totalPreviewTime;
            } else {
                if (currentTime >= window.totalPreviewTime) {
                    stopCursor();
                    return;
                }
            }

            const {x, y} = timeToXY(currentTime);
            setCursorPosition(x, y);

            // Request the next frame to keep the animation going
            animationId = requestAnimationFrame(updateCursor);
        }

        startCursor = function() {
            if (isPlaying) return;

            isPlaying = true;

            requestAnimationFrame(updateCursor)
        }

        function resetCursorPosition() {
            setCursorPosition(startX, startY);
        }

        stopCursor = function() {
            // Stop the animation and reset the cursor position
            cancelAnimationFrame(animationId);
            resetCursorPosition();
            isPlaying = false;
        }

        let stopButton = document.querySelector("#preview-stop");
        if (stopButton) {
        stopButton.addEventListener("click", () => {
            stopCursor();
        })
    }

});
