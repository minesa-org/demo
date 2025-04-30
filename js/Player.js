class Player {
    constructor(x, y, width = 400, height = 700, frameDelay = 5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 8;
        this.velocityX = 0;
        this.velocityY = 0;

        this.animations = {};
        this.currentAnimation = "ready";
        this.currentFrameIndex = 0;
        this.frameCount = 0;
        this.frameDelay = frameDelay;
        this.sprites = {};

        this.currentFrames = [];

        this.direction = "right";
        this.state = "looping";
    }

    async loadAnimations(jsonPath, characterFolder) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(
                    `Failed to load animation data from ${jsonPath}`
                );
            }

            this.animations = await response.json();

            for (const animName in this.animations) {
                const anim = this.animations[animName];

                if (
                    anim.loop &&
                    anim.loop[0] !== null &&
                    anim.loop[1] !== null
                ) {
                    const startPath = anim.loop[0];
                    const endPath = anim.loop[1];

                    const startFrame = parseInt(
                        startPath.split("/").pop().split(".")[0]
                    );
                    const endFrame = parseInt(
                        endPath.split("/").pop().split(".")[0]
                    );

                    for (let i = startFrame; i <= endFrame; i++) {
                        const path = `assets/player/${characterFolder}/${i}.svg`;
                        this.loadSprite(path);
                    }
                }

                if (
                    anim.start &&
                    anim.start[0] !== null &&
                    anim.start[1] !== null
                ) {
                    const startPath = anim.start[0];
                    const endPath = anim.start[1];

                    const startFrame = parseInt(
                        startPath.split("/").pop().split(".")[0]
                    );
                    const endFrame = parseInt(
                        endPath.split("/").pop().split(".")[0]
                    );

                    for (let i = startFrame; i <= endFrame; i++) {
                        const path = `assets/player/${characterFolder}/${i}.svg`;
                        this.loadSprite(path);
                    }
                }

                if (anim.end && anim.end[0] !== null && anim.end[1] !== null) {
                    const startPath = anim.end[0];
                    const endPath = anim.end[1];

                    const startFrame = parseInt(
                        startPath.split("/").pop().split(".")[0]
                    );
                    const endFrame = parseInt(
                        endPath.split("/").pop().split(".")[0]
                    );

                    for (let i = startFrame; i <= endFrame; i++) {
                        const path = `assets/player/${characterFolder}/${i}.svg`;
                        this.loadSprite(path);
                    }
                }
            }

            this.setAnimation("ready", characterFolder);
        } catch (error) {
            console.error("Error loading animations:", error);
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
        this.x += this.velocityX;
        this.y += this.velocityY;

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.updateAnimationFrame();
        }
    }

    updateAnimationFrame() {
        if (this.currentFrames.length === 0) return;

        this.currentFrameIndex =
            (this.currentFrameIndex + 1) % this.currentFrames.length;
    }

    render(ctx) {
        if (this.currentFrames.length === 0) return;

        const framePath = this.currentFrames[this.currentFrameIndex];

        const sprite = this.sprites[framePath];
        if (sprite && sprite.complete) {
            if (this.direction === "left") {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(
                    sprite,
                    -this.x - this.width,
                    this.y,
                    this.width,
                    this.height
                );
                ctx.restore();
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
        }
    }

    setAnimation(animName, characterFolder, resetFrame = true) {
        const anim = this.animations[animName];
        if (anim && (this.currentAnimation !== animName || resetFrame)) {
            this.currentAnimation = animName;
            this.currentFrames = [];

            let sequence;
            if (
                this.state === "starting" &&
                anim.start &&
                anim.start[0] !== null
            ) {
                sequence = anim.start;
            } else if (
                this.state === "ending" &&
                anim.end &&
                anim.end[0] !== null
            ) {
                sequence = anim.end;
            } else {
                sequence = anim.loop;
                this.state = "looping";
            }

            if (sequence && sequence[0] !== null && sequence[1] !== null) {
                const startPath = sequence[0];
                const endPath = sequence[1];

                const startFrame = parseInt(
                    startPath.split("/").pop().split(".")[0]
                );
                const endFrame = parseInt(
                    endPath.split("/").pop().split(".")[0]
                );

                for (let i = startFrame; i <= endFrame; i++) {
                    this.currentFrames.push(
                        `assets/player/${characterFolder}/${i}.svg`
                    );
                }
            }

            if (resetFrame) {
                this.currentFrameIndex = 0;
                this.frameCount = 0;
            }
        }
    }

    moveLeft() {
        this.velocityX = -this.speed;
        this.direction = "left";
    }

    moveRight() {
        this.velocityX = this.speed;
        this.direction = "right";
    }

    moveUp() {
        this.velocityY = -this.speed;
    }

    moveDown() {
        this.velocityY = this.speed;
    }

    stopX() {
        this.velocityX = 0;
    }

    stopY() {
        this.velocityY = 0;
    }

    attack() {}
}

export default Player;
