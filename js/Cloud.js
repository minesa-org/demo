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
    }

    async loadAnimations(jsonPath) {
        try {
            console.log(
                `Loading cloud animations from ${jsonPath} for ${this.type} cloud`
            );
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load cloud data from ${jsonPath}`);
            }

            const cloudData = await response.json();
            console.log("Cloud data loaded:", cloudData);

            const cloudType =
                this.type === "purple" ? "flicker_purple" : "flicker_gray";
            const cloudAnimation = cloudData.clouds[cloudType];
            console.log(
                `Cloud animation data for ${cloudType}:`,
                cloudAnimation
            );

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
                    console.log(`Adding cloud frame: ${path}`);
                    this.currentFrames.push(path);
                    this.loadSprite(path);
                }
            }
        } catch (error) {
            console.error("Error loading cloud animations:", error);
        }
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
    }

    render(ctx) {
        if (this.currentFrames.length === 0) {
            console.log(`No frames to render for ${this.type} cloud`);
            return;
        }

        const framePath = this.currentFrames[this.currentFrameIndex];
        const sprite = this.sprites[framePath];

        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        } else {
            console.log(
                `Sprite not ready for ${
                    this.type
                } cloud: ${framePath}, loaded: ${
                    sprite ? true : false
                }, complete: ${sprite ? sprite.complete : false}`
            );
        }
    }
}

export default Cloud;
