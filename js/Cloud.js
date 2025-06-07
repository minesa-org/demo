class Cloud {
    constructor(
        x,
        y,
        width,
        height,
        type,
        frameDelay = 3,
        initialDelay = null
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;

        this.frameDelay = frameDelay;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sprites = {};
        this.currentFrames = [];

        this.initialDelay =
            initialDelay !== null
                ? initialDelay
                : Math.floor(Math.random() * 120);
        this.delayRemaining = this.initialDelay;

        this.speed = this.type === "gray" ? 0.1 : 0.05;
        this.initialX = x;
    }

    async loadAnimations(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load cloud data from ${jsonPath}`);
            }

            const cloudData = await response.json();
            const cloudType =
                this.type === "purple" ? "flicker_purple" : "flicker_gray";
            const cloudAnimation = cloudData.clouds[cloudType];

            if (
                cloudAnimation &&
                cloudAnimation.loop &&
                cloudAnimation.loop[0] !== null &&
                cloudAnimation.loop[1] !== null
            ) {
                const startPath = cloudAnimation.loop[0];
                const endPath = cloudAnimation.loop[1];

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

        this.x -= this.speed;

        if (this.x < -this.width) {
            this.x = canvasWidth;

            const yVariation = 20;
            this.y += Math.random() * yVariation * 2 - yVariation;

            if (this.type === "purple" && this.y < 50) this.y = 50;
            if (this.type === "purple" && this.y > 120) this.y = 120;
            if (this.type === "gray" && this.y < 0) this.y = 0;
            if (this.type === "gray" && this.y > 50) this.y = 50;
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
}

export default Cloud;
