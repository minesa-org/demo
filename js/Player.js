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

        // Increment frame index
        this.currentFrameIndex++;

        // Check if we've reached the end of the current sequence
        if (this.currentFrameIndex >= this.currentFrames.length) {
            // Handle different animation states
            if (this.state === "starting") {
                // Transition from start to loop
                this.state = "looping";
                this.loadAnimationSequence("loop");
            } else if (this.state === "ending") {
                // Transition from end to ready
                this.state = "looping";
                this.currentAnimation = "ready";
                this.loadAnimationSequence("loop");
            } else {
                // Loop the current animation
                this.currentFrameIndex = 0;
            }
        }
    }

    loadAnimationSequence(sequenceType) {
        // Get the animation data for the current animation
        const anim = this.animations[this.currentAnimation];
        if (!anim) return;

        // Determine which sequence to use (start, loop, or end)
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
            // Default to loop sequence
            sequence = anim.loop;
        }

        // Make sure the sequence is valid
        if (sequence && sequence[0] !== null && sequence[1] !== null) {
            // Clear current frames
            this.currentFrames = [];

            // Extract frame numbers from paths
            const startPath = sequence[0];
            const endPath = sequence[1];

            const startFrame = parseInt(
                startPath.split("/").pop().split(".")[0]
            );
            const endFrame = parseInt(endPath.split("/").pop().split(".")[0]);

            // Create array of frame paths
            for (let i = startFrame; i <= endFrame; i++) {
                this.currentFrames.push(
                    `assets/player/${this.characterFolder}/${i}.svg`
                );
            }

            // Reset frame index
            this.currentFrameIndex = 0;
        }
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
        // Check if the animation exists and needs to be changed
        const anim = this.animations[animName];
        if (!anim || (this.currentAnimation === animName && !resetFrame)) {
            return;
        }

        // Set the new animation and character folder
        this.currentAnimation = animName;
        this.characterFolder = characterFolder;

        // Handle different animation types
        if (animName === "run") {
            // For run animation, start with the "start" sequence
            this.state = "starting";
            this.loadAnimationSequence("start");
        } else {
            // For other animations, use the "loop" sequence
            this.state = "looping";
            this.loadAnimationSequence("loop");
        }

        // Reset frame counters if needed
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

    moveUp() {
        this.velocityY = -this.speed;
    }

    moveDown() {
        this.velocityY = this.speed;
    }

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
