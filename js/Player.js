class Player {
    constructor(x, y, width = 400, height = 700, frameDelay = 5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 3.5;
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
            console.log(
                `Loading animations from ${jsonPath} for ${characterFolder}`
            );
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(
                    `Failed to load animation data from ${jsonPath}`
                );
            }

            this.animations = await response.json();
            console.log("Animation data loaded:", this.animations);

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

    render(ctx) {
        if (this.currentFrames.length === 0) {
            console.log("No frames to render for player");
            return;
        }

        const framePath = this.currentFrames[this.currentFrameIndex];
        console.log(
            `Rendering player frame: ${framePath}, index: ${
                this.currentFrameIndex
            }/${this.currentFrames.length - 1}`
        );

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
        } else {
            console.log(
                `Sprite not ready: ${framePath}, loaded: ${
                    sprite ? true : false
                }, complete: ${sprite ? sprite.complete : false}`
            );
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
