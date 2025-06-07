class Splash {
    constructor(x, y, width, height, frameDelay = 6, initialDelay = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.frameDelay = frameDelay;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sprites = {};
        this.currentFrames = [];

        this.initialDelay = initialDelay;
        this.delayRemaining = this.initialDelay;
    }

    async loadAnimations(jsonPath, splashType = "_4") {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load splash data from ${jsonPath}`);
            }

            const splashData = await response.json();

            if (
                splashData.splash &&
                splashData.splash[splashType] &&
                splashData.splash[splashType].start &&
                splashData.splash[splashType].start[0] !== null &&
                splashData.splash[splashType].start[1] !== null
            ) {
                const startPath = splashData.splash[splashType].start[0];
                const endPath = splashData.splash[splashType].start[1];

                const startFrame = parseInt(
                    startPath.split("/").pop().split(".")[0]
                );
                const endFrame = parseInt(
                    endPath.split("/").pop().split(".")[0]
                );

                for (let i = startFrame; i <= endFrame; i++) {
                    const path = `assets/lost_at_sea/splashes/${splashType}/${i}.svg`;
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

    update() {
        if (this.delayRemaining > 0) {
            this.delayRemaining--;
            return;
        }

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.currentFrameIndex++;

            if (this.currentFrameIndex >= this.currentFrames.length) {
                this.currentFrameIndex = 0;
            }
        }
    }

    render(ctx) {
        if (this.currentFrames.length === 0) {
            return;
        }

        const framePath = this.currentFrames[this.currentFrameIndex];
        const sprite = this.sprites[framePath];

        // Görselin hem yüklü hem de bozuk olmadığından emin ol
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
    }

    reset() {
        this.currentFrameIndex = 0;
        this.frameCount = 0;
        this.delayRemaining = this.initialDelay;
    }
}

export default Splash;
