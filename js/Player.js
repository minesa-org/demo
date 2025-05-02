class Player {
    constructor(x, y, width = 400, height = 700, frameDelay = 5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 3.5;
        this.velocityX = 0;
        this.velocityY = 0;

        this.minX = 0;
        this.maxX = 0;
        this.boundariesSet = false;

        this.effectiveWidthRatio = 0.3;
        this.effectiveWidthOffset = 0.35;

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
        const newX = this.x + this.velocityX;
        const effectiveWidth = this.width * this.effectiveWidthRatio;

        if (this.boundariesSet) {
            const newSpriteCenter = newX + this.width / 2;
            const newHitboxLeft = newSpriteCenter - effectiveWidth / 2;
            const newHitboxRight = newSpriteCenter + effectiveWidth / 2;

            if (newHitboxLeft >= this.minX && newHitboxRight <= this.maxX) {
                this.x = newX;
            } else if (newHitboxLeft < this.minX) {
                const adjustment = this.minX - newHitboxLeft;
                this.x = newX + adjustment;
            } else if (newHitboxRight > this.maxX) {
                const adjustment = newHitboxRight - this.maxX;
                this.x = newX - adjustment;
            }
        } else {
            this.x = newX;
        }

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.updateAnimationFrame();
        }
    }

    setMovementBoundaries(minX, maxX) {
        this.minX = minX;
        this.maxX = maxX;
        this.boundariesSet = true;

        const movementRange = maxX - minX - this.width;
        if (movementRange < 100) {
            this.speed = 2.5;
        } else if (movementRange < 200) {
            this.speed = 3.0;
        } else {
            this.speed = 3.5;
        }
    }

    updateAnimationFrame() {
        if (this.currentFrames.length === 0) return;

        this.currentFrameIndex++;

        if (this.currentFrameIndex >= this.currentFrames.length) {
            if (this.state === "starting") {
                this.state = "looping";
                this.loadAnimationSequence("loop");
            } else if (this.state === "ending") {
                this.state = "looping";
                this.currentAnimation = "ready";
                this.loadAnimationSequence("loop");
            } else {
                this.currentFrameIndex = 0;
            }
        }
    }

    loadAnimationSequence(sequenceType) {
        const anim = this.animations[this.currentAnimation];
        if (!anim) return;

        let sequence;
        if (
            sequenceType === "start" &&
            anim.start &&
            anim.start[0] !== null &&
            anim.start[1] !== null
        ) {
            sequence = anim.start;
        } else if (
            sequenceType === "end" &&
            anim.end &&
            anim.end[0] !== null &&
            anim.end[1] !== null
        ) {
            sequence = anim.end;
        } else {
            sequence = anim.loop;
        }

        if (sequence && sequence[0] !== null && sequence[1] !== null) {
            this.currentFrames = [];

            const startPath = sequence[0];
            const endPath = sequence[1];

            const startFrame = parseInt(
                startPath.split("/").pop().split(".")[0]
            );
            const endFrame = parseInt(endPath.split("/").pop().split(".")[0]);

            for (let i = startFrame; i <= endFrame; i++) {
                this.currentFrames.push(
                    `assets/player/${this.characterFolder}/${i}.svg`
                );
            }

            this.currentFrameIndex = 0;
        }
    }

    renderShadow(ctx) {
        const shadowWidth = this.width * this.effectiveWidthRatio * 0.6;
        const shadowHeight = shadowWidth * 0.25;

        let shadowX;

        if (this.direction === "left") {
            shadowX = this.x + this.width * 0.55;
        } else {
            shadowX = this.x + this.width / 2.2;
        }

        const shadowY = this.y + this.height * 0.83;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
            shadowX,
            shadowY,
            shadowWidth / 2,
            shadowHeight / 2,
            0,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fill();
        ctx.restore();
    }

    render(ctx) {
        if (this.currentFrames.length === 0) {
            return;
        }

        const framePath = this.currentFrames[this.currentFrameIndex];

        this.renderShadow(ctx);

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
        if (!anim || (this.currentAnimation === animName && !resetFrame)) {
            return;
        }

        this.currentAnimation = animName;
        this.characterFolder = characterFolder;

        if (animName === "run") {
            this.state = "starting";
            this.loadAnimationSequence("start");
        } else {
            this.state = "looping";
            this.loadAnimationSequence("loop");
        }

        if (resetFrame) {
            this.currentFrameIndex = 0;
            this.frameCount = 0;
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

    moveUp() {}

    moveDown() {}

    stopX() {
        this.velocityX = 0;
        this.checkStopAnimation();
    }

    stopY() {
        this.velocityY = 0;
        this.checkStopAnimation();
    }

    checkStopAnimation() {
        if (
            this.velocityX === 0 &&
            this.velocityY === 0 &&
            this.currentAnimation === "run" &&
            this.state !== "ending"
        ) {
            this.state = "ending";
            this.loadAnimationSequence("end");
        }
    }
}

export default Player;
