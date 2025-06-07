class Wave {
    constructor(x, y, width, height, frameDelay = 3, initialDelay = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.frameDelay = frameDelay;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sprites = {};
        this.currentFrames = [];

        this.initialDelay =
            initialDelay !== null
                ? initialDelay
                : Math.floor(Math.random() * 30);
        this.delayRemaining = this.initialDelay;

        this.scrollSpeed = 0;
        this.initialX = x;
    }

    async loadAnimations(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load wave data from ${jsonPath}`);
            }

            const waveData = await response.json();

            if (
                waveData.wave &&
                waveData.wave.loop &&
                waveData.wave.loop[0] !== null &&
                waveData.wave.loop[1] !== null
            ) {
                const startPath = waveData.wave.loop[0];
                const endPath = waveData.wave.loop[1];

                const startFrame = parseInt(
                    startPath.split("/").pop().split(".")[0]
                );
                const endFrame = parseInt(
                    endPath.split("/").pop().split(".")[0]
                );

                for (let i = startFrame; i <= endFrame; i++) {
                    const basePath = startPath.substring(
                        0,
                        startPath.lastIndexOf("/") + 1
                    );
                    const path = `${basePath}${i}.svg`;
                    this.currentFrames.push(path);
                    this.loadSprite(path);
                }
            }
        } catch (error) {}
    }

    loadSprite(path) {
        if (!this.sprites[path]) {
            const img = new Image();
            img.src = path;
            this.sprites[path] = img;
        }
    }

    update(canvasWidth) {
        if (this.delayRemaining > 0) {
            this.delayRemaining--;

            if (this.delayRemaining === 0 && this.currentFrames.length > 0) {
                this.currentFrameIndex = Math.floor(
                    Math.random() * this.currentFrames.length
                );
            }
            return;
        }

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.currentFrameIndex =
                (this.currentFrameIndex + 1) % this.currentFrames.length;
        }

        this.x -= this.scrollSpeed;

        if (this.x < -this.width + 5) {
            this.x = canvasWidth - 5;
        }
    }

    render(ctx) {
        if (this.currentFrames.length === 0) {
            return;
        }

        const framePath = this.currentFrames[this.currentFrameIndex];
        const sprite = this.sprites[framePath];

        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
    }
}

export default Wave;
