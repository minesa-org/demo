class Captain {
    constructor(x, y, width = 200, height = 250, frameDelay = 4) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.frameDelay = frameDelay;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sprites = {};
        this.currentFrames = [];

        this.initialDelay = Math.floor(Math.random() * 10);
        this.delayRemaining = this.initialDelay;
    }

    async loadAnimations(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                return;
            }

            const captainData = await response.json();

            if (
                captainData.captain &&
                captainData.captain.steer &&
                captainData.captain.steer.loop &&
                captainData.captain.steer.loop[0] !== null &&
                captainData.captain.steer.loop[1] !== null
            ) {
                const startPath = captainData.captain.steer.loop[0];
                const endPath = captainData.captain.steer.loop[1];

                let startFrame, endFrame;
                try {
                    startFrame = parseInt(
                        startPath.split("/").pop().split(".")[0]
                    );
                    endFrame = parseInt(endPath.split("/").pop().split(".")[0]);
                } catch (e) {
                    startFrame = 929;
                    endFrame = 1105;
                }

                for (let i = startFrame; i <= endFrame; i++) {
                    try {
                        const path = `assets/lost_at_sea/captain/${i}.svg`;
                        this.currentFrames.push(path);
                        this.loadSprite(path);
                    } catch (e) {}
                }

                if (this.currentFrames.length === 0) {
                    const fallbackPath = "assets/lost_at_sea/captain/929.svg";
                    this.currentFrames.push(fallbackPath);
                    this.loadSprite(fallbackPath);
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
        try {
            if (this.delayRemaining > 0) {
                this.delayRemaining--;
                return;
            }

            this.frameCount++;
            if (this.frameCount >= this.frameDelay) {
                this.frameCount = 0;

                if (this.currentFrames.length > 0) {
                    this.currentFrameIndex =
                        (this.currentFrameIndex + 1) %
                        this.currentFrames.length;
                }
            }
        } catch (error) {
            this.frameCount = 0;
            this.currentFrameIndex = 0;
        }
    }

    render(ctx) {
        if (this.currentFrames.length === 0) {
            return;
        }

        try {
            if (this.currentFrameIndex >= this.currentFrames.length) {
                this.currentFrameIndex = 0;
            }

            const framePath = this.currentFrames[this.currentFrameIndex];
            const sprite = this.sprites[framePath];

            if (sprite && sprite.complete) {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
        } catch (error) {}
    }

    updatePosition(boatX, boatY, boatWidth, boatHeight) {
        this.x = boatX + boatWidth * 0.7 - this.width / 2;
        this.y = boatY + boatHeight * 0.1 - this.height / 2;
    }
}

export default Captain;
