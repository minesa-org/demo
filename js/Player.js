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

        // Default effective width ratio - will be overridden in child classes
        this.effectiveWidthRatio = 0.3;
        this.effectiveWidthOffset = 0.35;

        // Default effective height ratio - will be overridden in child classes
        this.effectiveHeightRatio = 0.3;

        this.animations = {};
        this.currentAnimation = "ready";
        this.currentFrameIndex = 0;
        this.frameCount = 0;
        this.frameDelay = frameDelay;
        this.sprites = {};

        this.currentFrames = [];

        this.direction = "right";
        this.state = "looping";

        // Callbacks for animation state changes
        this.callbacks = {
            onJumpEnd: null,
            onJumpLand: null,
        };

        // Jump properties - isJumping is made public for access from Game.js
        this.isJumping = false;
        this.isFalling = false; // Track falling phase separately
        this.jumpSpeed = -10; // Initial upward velocity
        this.riseGravity = 0.35; // Gravity during rise phase
        this.fallGravity = 0.35; // Reduced gravity during fall phase for slower descent
        this.initialY = y;

        // Attack properties
        this.isAttacking = false;
        this.currentAttackType = "first";
        this.attackSequence = ["first", "second", "third"];
        this.attackIndex = 0;

        // Ranged attack properties
        this.isRangedAttack = true;
        this.rangedAttackAngle = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        // Basic attack cooldown properties
        this.currentAttackCooldown = 0;
        // Default max cooldown (can be overridden in child classes like Paladin)
        this.basicAttackCooldownMax = 20; // Frames between attacks (20 frames at 60 FPS = 0.33 seconds)

        // Skill properties
        this.skillCooldown = 0;
        this.skillDuration = 60; // 1 saniye (60fps)
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

            // Helper function to load sprites for an animation sequence
            const loadSequenceSprites = (sequence) => {
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
                        const path = `assets/player/${characterFolder}/${i}.svg`;
                        this.loadSprite(path);
                    }
                }
            };

            // Process regular animations
            for (const animName in this.animations) {
                const anim = this.animations[animName];

                // Handle nested animations like melee.first, melee.second, etc.
                if (typeof anim === "object" && anim !== null) {
                    if (animName === "melee") {
                        // Process each melee attack type
                        for (const attackType in anim) {
                            const attackAnim = anim[attackType];
                            loadSequenceSprites(attackAnim.start);
                            loadSequenceSprites(attackAnim.loop);
                            loadSequenceSprites(attackAnim.end);
                        }
                    } else {
                        // Process regular animations
                        loadSequenceSprites(anim.start);
                        loadSequenceSprites(anim.loop);
                        loadSequenceSprites(anim.end);
                    }
                }
            }

            this.setAnimation("ready", characterFolder);
        } catch (error) {}
    }

    loadSprite(path) {
        if (!this.sprites[path]) {
            console.log(`Loading sprite: ${path}`);
            const img = new Image();

            // Add event listeners to track loading status
            img.onload = () => {
                console.log(`Sprite loaded successfully: ${path}`);
            };

            img.onerror = () => {
                console.error(`Failed to load sprite: ${path}`);
                // Create a placeholder for failed sprites to prevent rendering issues
                const placeholderImg = new Image();
                placeholderImg.width = 100;
                placeholderImg.height = 100;
                this.sprites[path] = placeholderImg;
            };

            img.src = path;
            this.sprites[path] = img;
        }
    }

    update() {
        // Handle horizontal movement
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

        // Decrement basic attack cooldown
        if (this.currentAttackCooldown > 0) {
            this.currentAttackCooldown--;
        }

        // Handle jumping
        if (this.isJumping) {
            // Apply different gravity based on whether we're rising or falling
            if (this.velocityY < 0) {
                // Rising - use normal gravity
                this.velocityY += this.riseGravity;
                this.isFalling = false;
            } else {
                // Falling - use reduced gravity for slower descent
                this.velocityY += this.fallGravity;
                this.isFalling = true;
            }

            // Update position
            this.y += this.velocityY;

            // Check if we've reached the peak (velocity changes from negative to positive)
            if (this.velocityY >= 0 && this.state === "starting") {
                this.state = "looping";
                this.loadAnimationSequence("loop");
                // Peak of jump reached
            }

            // Check if we've landed
            if (this.y >= this.initialY) {
                // Reset position and velocity
                this.y = this.initialY;
                this.velocityY = 0;

                // Check if player is still moving horizontally
                if (Math.abs(this.velocityX) > 0.1) {
                    // If still moving, go directly to run animation
                    this.isJumping = false;
                    this.currentAnimation = "run";
                    this.state = "starting";
                    this.loadAnimationSequence("start");

                    // Player has landed and is running - call the callback (if set)
                    const callback = this.callbacks.onJumpLand;
                    if (callback) {
                        // Use setTimeout to avoid blocking the main thread
                        setTimeout(() => callback(true), 0);
                    }
                }
                // Otherwise play landing animation
                else if (this.state !== "ending") {
                    this.state = "ending";
                    this.loadAnimationSequence("end");

                    // Player has landed but not running - call the callback (if set)
                    const callback = this.callbacks.onJumpLand;
                    if (callback) {
                        // Use setTimeout to avoid blocking the main thread
                        setTimeout(() => callback(false), 0);
                    }
                }
            }
        }

        // Update animation frames
        this.frameCount++;

        // Use a different frame delay for jump animation to match the physics better
        let currentFrameDelay = this.frameDelay;
        if (this.currentAnimation === "jump") {
            // Slower animation for jump to make it last about 2 seconds total
            currentFrameDelay = this.frameDelay * 1;
        }

        if (this.frameCount >= currentFrameDelay) {
            this.frameCount = 0;
            this.updateAnimationFrame();
        }

        // Decrement skill cooldown
        if (this.skillCooldown > 0) {
            this.skillCooldown--;
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
            // If we're at the end of the starting animation, transition to looping
            if (this.state === "starting") {
                this.state = "looping";
                this.loadAnimationSequence("loop");
            }
            // If we're at the end of the ending animation, go back to ready state
            else if (this.state === "ending") {
                // If we were jumping, make sure we're fully reset
                if (this.currentAnimation === "jump") {
                    // Jump animation complete

                    // Reset jumping, falling, and attacking states
                    this.isJumping = false;
                    this.isFalling = false;
                    this.isAttacking = false; // Ensure attacking state is reset
                    this.velocityY = 0;

                    // Check if player is moving horizontally
                    if (Math.abs(this.velocityX) > 0.1) {
                        // If moving, transition to run animation
                        this.state = "starting";
                        this.currentAnimation = "run";
                        this.loadAnimationSequence("start");
                    } else {
                        // Otherwise go back to ready state
                        this.state = "looping";
                        this.currentAnimation = "ready";
                        this.loadAnimationSequence("loop");
                    }
                }
                // Handle melee attack animations
                else if (
                    this.currentAnimation.startsWith("melee.") ||
                    this.currentAnimation.startsWith("ranged.")
                ) {
                    try {
                        // Reset attacking flag
                        this.isAttacking = false;

                        // Go back to ready state
                        this.state = "looping";
                        this.currentAnimation = "ready";
                        this.loadAnimationSequence("loop");
                        this.currentFrameIndex = 0;
                    } catch (e) {
                        // If any error occurs, force reset to ready state
                        this.isAttacking = false;
                        this.state = "looping";
                        this.currentAnimation = "ready";
                        this.loadAnimationSequence("loop");
                        this.currentFrameIndex = 0;
                    }
                } else {
                    // For other animations like run
                    this.state = "looping";
                    this.currentAnimation = "ready";
                    this.loadAnimationSequence("loop");
                }
            }
            // If we're looping, handle based on animation type
            else {
                // For melee and ranged attacks in looping state, we want to complete the animation and then go back to ready
                if (
                    (this.currentAnimation.startsWith("melee.") ||
                        this.currentAnimation.startsWith("ranged.")) &&
                    this.isAttacking
                ) {
                    try {
                        // Reset attacking flag
                        this.isAttacking = false;

                        // Go back to ready state
                        this.state = "looping";
                        this.currentAnimation = "ready";
                        this.loadAnimationSequence("loop");
                        this.currentFrameIndex = 0;
                    } catch (e) {
                        // If any error occurs, force reset to ready state
                        this.isAttacking = false;
                        this.state = "looping";
                        this.currentAnimation = "ready";
                        this.loadAnimationSequence("loop");
                        this.currentFrameIndex = 0;
                    }
                } else {
                    // For other animations, just reset the frame index
                    this.currentFrameIndex = 0;
                }
            }
        }
    }

    loadAnimationSequence(sequenceType) {
        console.log(
            `Loading animation sequence: ${this.currentAnimation}, sequence: ${sequenceType}`
        );
        try {
            // Handle nested animation paths like "melee.first" or "ranged.default"
            let anim;
            if (this.currentAnimation.includes(".")) {
                const [category, subType] = this.currentAnimation.split(".");
                console.log(
                    `Looking for nested animation: category=${category}, subType=${subType}`
                );
                anim = this.animations[category]?.[subType];
                if (anim) {
                    console.log(
                        `Found nested animation: ${category}.${subType}`
                    );
                } else {
                    console.log(`Animation not found: ${category}.${subType}`);
                }
            } else {
                console.log(`Looking for animation: ${this.currentAnimation}`);
                anim = this.animations[this.currentAnimation];
                if (anim) {
                    console.log(`Found animation: ${this.currentAnimation}`);
                } else {
                    console.log(
                        `Animation not found: ${this.currentAnimation}`
                    );
                }
            }

            if (!anim) {
                console.log(
                    `Animation not found, falling back to ready animation`
                );
                // If animation doesn't exist, fall back to ready animation
                this.currentAnimation = "ready";
                anim = this.animations["ready"];
                if (!anim) {
                    console.log(`Ready animation not found either, returning`);
                    return; // Safety check
                }
            }

            // Get the appropriate sequence (start, loop, or end)
            let sequence;
            if (
                sequenceType === "start" &&
                anim.start &&
                anim.start[0] !== null &&
                anim.start[1] !== null
            ) {
                sequence = anim.start;
                console.log(
                    `Using start sequence: ${JSON.stringify(sequence)}`
                );
            } else if (
                sequenceType === "end" &&
                anim.end &&
                anim.end[0] !== null &&
                anim.end[1] !== null
            ) {
                sequence = anim.end;
                console.log(`Using end sequence: ${JSON.stringify(sequence)}`);
            } else {
                sequence = anim.loop;
                console.log(`Using loop sequence: ${JSON.stringify(sequence)}`);
            }

            // Safety check for sequence
            if (!sequence || !sequence[0] || !sequence[1]) {
                console.log(
                    `Invalid sequence, falling back to ready animation loop`
                );
                // If sequence is invalid, fall back to ready animation loop
                this.currentAnimation = "ready";
                sequence = this.animations["ready"]?.loop;
                if (!sequence || !sequence[0] || !sequence[1]) {
                    console.log(
                        `Ready animation loop not found either, returning`
                    );
                    return; // Final safety check
                }
            }

            // Create a new array with the right capacity to avoid resizing
            const startPath = sequence[0];
            const endPath = sequence[1];

            try {
                // Extract frame numbers more efficiently
                const startFrameStr = startPath.split("/").pop();
                const endFrameStr = endPath.split("/").pop();

                if (!startFrameStr || !endFrameStr) return; // Safety check

                const startFrame = parseInt(
                    startFrameStr.substring(0, startFrameStr.indexOf("."))
                );
                const endFrame = parseInt(
                    endFrameStr.substring(0, endFrameStr.indexOf("."))
                );

                if (
                    isNaN(startFrame) ||
                    isNaN(endFrame) ||
                    startFrame > endFrame
                ) {
                    // Invalid frame numbers, fall back to ready animation
                    console.error(
                        `Invalid frame numbers: ${startFrame} to ${endFrame}`
                    );
                    this.currentAnimation = "ready";
                    return;
                }

                // Pre-calculate the base path to avoid string concatenation in the loop
                const basePath = `assets/player/${this.characterFolder}/`;

                // Reset frames array
                this.currentFrames = [];

                // Populate frames array
                for (let i = startFrame; i <= endFrame; i++) {
                    const framePath = basePath + i + ".svg";
                    this.currentFrames.push(framePath);

                    // For ranged attacks, preload the sprites immediately
                    if (this.currentAnimation.startsWith("ranged")) {
                        if (!this.sprites[framePath]) {
                            console.log(
                                `Preloading ranged frame: ${framePath}`
                            );
                            this.loadSprite(framePath);
                        }
                    }
                }

                this.currentFrameIndex = 0;

                // For ranged attacks, ensure the first frame is loaded
                if (
                    this.currentAnimation.startsWith("ranged") &&
                    this.currentFrames.length > 0
                ) {
                    const firstFramePath = this.currentFrames[0];
                    if (
                        !this.sprites[firstFramePath] ||
                        !this.sprites[firstFramePath].complete
                    ) {
                        console.log(
                            `Ensuring first ranged frame is loaded: ${firstFramePath}`
                        );
                        this.loadSprite(firstFramePath);
                    }
                }
            } catch (e) {
                console.error("Error processing animation frames:", e);
                // If any error occurs during frame processing, reset to ready state
                this.currentAnimation = "ready";
                this.state = "looping";
                this.isAttacking = false;
            }
        } catch (e) {
            console.error("Error loading animation sequence:", e);
            // If any error occurs, reset to a safe state
            this.currentAnimation = "ready";
            this.state = "looping";
            this.isAttacking = false;
        }
    }

    renderShadow(ctx) {
        // Don't render shadow if jumping
        if (this.isJumping) {
            return;
        }

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

    // Calculate effective width ratio based on desired effective width
    calculateEffectiveWidthRatio(desiredEffectiveWidth) {
        return desiredEffectiveWidth / this.width;
    }

    // Calculate effective height ratio based on desired effective height
    calculateEffectiveHeightRatio(desiredEffectiveHeight) {
        return desiredEffectiveHeight / this.height;
    }

    // Calculate fire socket position based on character type and aim direction
    calculateFireSocketPosition(angle) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Determine aim type based on angle
        const angleDegrees = angle * (180 / Math.PI);
        let aimType = "default";

        if (angleDegrees > -110 && angleDegrees < -70) {
            aimType = "up_90";
        } else if (angleDegrees > 70 && angleDegrees < 110) {
            aimType = "down_90";
        } else if (angleDegrees > -70 && angleDegrees < -20) {
            aimType = "up_45";
        } else if (angleDegrees > 20 && angleDegrees < 70) {
            aimType = "down_45";
        }

        // Start with center position
        let fireSocketX = centerX;
        let fireSocketY = centerY;

        // Determine direction multiplier
        const directionMultiplier = this.direction === "right" ? 1 : -1;

        // Character-specific offsets
        const characterType = this.constructor.name.toLowerCase();
        let heightOffsetRatio = 0.2;
        let widthOffsetRatio = 0.25;

        if (characterType === "mage") {
            heightOffsetRatio = 0.22;
            widthOffsetRatio = 0.28;
        } else if (characterType === "paladin") {
            heightOffsetRatio = 0.18;
            widthOffsetRatio = 0.22;
        } else if (characterType === "rogue") {
            heightOffsetRatio = 0.2;
            widthOffsetRatio = 0.25;
        }

        const heightOffset = this.height * heightOffsetRatio;
        const widthOffset = this.width * widthOffsetRatio;

        // Apply character-specific positioning
        if (characterType === "paladin") {
            switch (aimType) {
                case "up_90":
                    fireSocketY = centerY - heightOffset * -0.1;
                    break;
                case "up_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY - heightOffset * -0.5;
                    break;
                case "default":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY - heightOffset * -0.8;
                    break;
                case "down_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.6;
                    fireSocketY = centerY + heightOffset * -0.2;
                    break;
                case "down_90":
                    fireSocketY = centerY + heightOffset * 0.8;
                    break;
            }
        } else if (characterType === "mage") {
            switch (aimType) {
                case "up_90":
                    fireSocketY = centerY - heightOffset * 1.2;
                    break;
                case "up_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.9;
                    fireSocketY = centerY - heightOffset * 0.8;
                    break;
                case "default":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.1;
                    fireSocketY = centerY - heightOffset * 0.2;
                    break;
                case "down_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.7;
                    fireSocketY = centerY + heightOffset * 0.4;
                    break;
                case "down_90":
                    fireSocketY = centerY + heightOffset * 1.4;
                    break;
            }
        } else {
            // Rogue
            switch (aimType) {
                case "up_90":
                    fireSocketY = centerY - heightOffset * 1.0;
                    break;
                case "up_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.0;
                    fireSocketY = centerY - heightOffset * 0.6;
                    break;
                case "default":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.2;
                    fireSocketY = centerY;
                    break;
                case "down_45":
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY + heightOffset * 0.6;
                    break;
                case "down_90":
                    fireSocketY = centerY + heightOffset * 1.2;
                    break;
            }
        }

        return { x: fireSocketX, y: fireSocketY, aimType };
    }

    renderHitbox(ctx) {
        // Draw the full sprite box
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw the effective hitbox (used for collision detection and attack detection)
        const effectiveWidth = this.width * this.effectiveWidthRatio;
        const effectiveHeight = this.height * this.effectiveHeightRatio;
        const hitboxX = this.x + (this.width - effectiveWidth) / 2;
        // Position the effective height box lower to match character's body/feet area
        const verticalOffset = this.height * 0.25; // Move down by 15% of character height
        const hitboxY =
            this.y + (this.height - effectiveHeight) / 2 + verticalOffset;

        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.strokeRect(hitboxX, hitboxY, effectiveWidth, effectiveHeight);

        // Draw character class and dimensions text
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`${this.constructor.name}`, this.x, this.y - 25);
        ctx.fillText(`Width: ${this.width.toFixed(2)}`, this.x, this.y - 10);
        ctx.fillText(`Height: ${this.height.toFixed(2)}`, this.x, this.y + 5);
        ctx.fillText(
            `Effective Width: ${effectiveWidth.toFixed(2)}`,
            this.x,
            this.y + 20
        );
        ctx.fillText(
            `Effective Height: ${effectiveHeight.toFixed(2)}`,
            this.x,
            this.y + 35
        );
        ctx.fillText(
            `W Ratio: ${this.effectiveWidthRatio.toFixed(4)}`,
            this.x,
            this.y + 50
        );
        ctx.fillText(
            `H Ratio: ${this.effectiveHeightRatio.toFixed(4)}`,
            this.x,
            this.y + 65
        );

        // Remove the aim direction visualization code

        ctx.restore();
    }

    renderAimDirection(ctx) {
        // Use the unified fire socket calculation
        const fireSocketInfo = this.calculateFireSocketPosition(
            this.rangedAttackAngle
        );
        const fireSocketX = fireSocketInfo.x;
        const fireSocketY = fireSocketInfo.y;

        // Draw fire socket
        ctx.beginPath();
        ctx.arc(fireSocketX, fireSocketY, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 165, 0, 0.8)"; // Orange
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)"; // Red
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw aim line
        const lineLength = 100;
        const endX =
            fireSocketX + Math.cos(this.rangedAttackAngle) * lineLength;
        const endY =
            fireSocketY + Math.sin(this.rangedAttackAngle) * lineLength;

        ctx.beginPath();
        ctx.moveTo(fireSocketX, fireSocketY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; // Yellow
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw angle text
        const angleDegrees = ((this.rangedAttackAngle * 180) / Math.PI).toFixed(
            1
        );
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Angle: ${angleDegrees}°`, endX + 5, endY);

        // Use the aim type from fire socket calculation
        const aimType = fireSocketInfo.aimType;

        ctx.fillText(`Aim Type: ${aimType}`, endX + 5, endY + 20);

        // Draw mouse position
        if (this.mouseX && this.mouseY) {
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 255, 255, 0.8)"; // Cyan
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw line from fire socket to mouse
            ctx.beginPath();
            ctx.moveTo(fireSocketX, fireSocketY);
            ctx.lineTo(this.mouseX, this.mouseY);
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)"; // Cyan with transparency
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    render(ctx) {
        try {
            if (!this.currentFrames || this.currentFrames.length === 0) {
                return;
            }

            // Safety check for currentFrameIndex
            if (
                this.currentFrameIndex < 0 ||
                this.currentFrameIndex >= this.currentFrames.length
            ) {
                this.currentFrameIndex = 0;
            }

            const framePath = this.currentFrames[this.currentFrameIndex];
            if (!framePath) return;

            this.renderShadow(ctx);

            // Draw character hitbox if enabled
            if (window.showHitboxes) {
                this.renderHitbox(ctx);
            }

            // Draw aim visualization if enabled
            if (window.showAimDebug) {
                this.renderAimDirection(ctx);
            }

            // Get the sprite for the current frame
            const sprite = this.sprites[framePath];

            // Only render if the sprite exists and is loaded
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
                    ctx.drawImage(
                        sprite,
                        this.x,
                        this.y,
                        this.width,
                        this.height
                    );
                }
            }
        } catch (e) {
            console.error("Error rendering player:", e);
        }
    }

    setAnimation(animName, characterFolder, resetFrame = true) {
        try {
            // Handle nested animation paths like "melee.first"
            let anim;
            if (animName.includes(".")) {
                const [category, subType] = animName.split(".");
                anim = this.animations[category]?.[subType];
            } else {
                anim = this.animations[animName];
            }

            if (!anim || (this.currentAnimation === animName && !resetFrame)) {
                return;
            }

            this.currentAnimation = animName;
            this.characterFolder = characterFolder;

            // For jump animation, always start with the "start" sequence
            if (animName === "jump") {
                this.state = "starting";
                this.loadAnimationSequence("start");
            }
            // For run animation, start with "start" sequence
            else if (animName === "run") {
                this.state = "starting";
                this.loadAnimationSequence("start");
            }
            // For melee attacks, use the loop sequence
            else if (animName.startsWith("melee.")) {
                this.state = "looping";
                this.loadAnimationSequence("loop");
            }
            // For other animations, go straight to looping
            else {
                this.state = "looping";
                this.loadAnimationSequence("loop");
            }

            if (resetFrame) {
                this.currentFrameIndex = 0;
                this.frameCount = 0;
            }
        } catch (e) {
            // If setting animation fails, reset to ready state
            this.currentAnimation = "ready";
            this.state = "looping";
            this.isAttacking = false;

            try {
                this.loadAnimationSequence("loop");
                this.currentFrameIndex = 0;
                this.frameCount = 0;
            } catch (innerError) {
                // Last resort - if even this fails, we'll just continue
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

    jump() {
        // Only allow jumping if not already jumping
        if (!this.isJumping) {
            // Set jumping flag first (important for state tracking)
            this.isJumping = true;

            // Reset attacking state if player was attacking
            // This ensures player can attack again after landing
            if (this.isAttacking) {
                this.isAttacking = false;
            }

            // Store initial position
            this.initialJumpY = this.y;

            // Set initial velocity for jump (negative Y is up)
            this.velocityY = this.jumpSpeed;

            // Set animation state
            this.currentAnimation = "jump";
            this.state = "starting";

            // Load animation frames
            this.loadAnimationSequence("start");

            // Reset animation counters
            this.currentFrameIndex = 0;
            this.frameCount = 0;
        }
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
        // Only end run animation when stopping movement
        // Jump animation is handled separately in the update method
        if (
            this.velocityX === 0 &&
            this.velocityY === 0 &&
            this.currentAnimation === "run" &&
            this.state !== "ending" &&
            !this.isJumping
        ) {
            this.state = "ending";
            this.loadAnimationSequence("end");
        }
    }

    // Method to set callbacks
    setCallbacks(callbacks) {
        if (callbacks.onJumpEnd) {
            this.callbacks.onJumpEnd = callbacks.onJumpEnd;
        }
        if (callbacks.onJumpLand) {
            this.callbacks.onJumpLand = callbacks.onJumpLand;
        }
    }

    // Method to determine if attack should be melee or ranged based on mouse position
    attack(mouseX, mouseY) {
        // Store mouse position for ranged attacks and visualization
        this.mouseX = mouseX;
        this.mouseY = mouseY;

        console.log(`Attack called with mouse at (${mouseX}, ${mouseY})`);

        // Don't allow attacking while jumping or already attacking
        // Also check if the basic attack is on cooldown
        if (
            this.isJumping ||
            this.isAttacking ||
            this.currentAttackCooldown > 0
        ) {
            console.log(
                "Attack blocked: Player is jumping, already attacking, or attack is on cooldown"
            );
            return { success: false, isRanged: false };
        }

        // Calculate if this should be a melee or ranged attack based on mouse position
        const effectiveWidth = this.width * this.effectiveWidthRatio;
        const effectiveHeight = this.height * this.effectiveHeightRatio;

        // Use the same positioning as the visual hitbox
        const hitboxX = this.x + (this.width - effectiveWidth) / 2;
        const verticalOffset = this.height * 0.15; // Same offset as visual hitbox
        const hitboxY =
            this.y + (this.height - effectiveHeight) / 2 + verticalOffset;

        // Calculate center of the effective hitbox (not the sprite center)
        const effectiveHitboxCenterX = hitboxX + effectiveWidth / 2;
        const effectiveHitboxCenterY = hitboxY + effectiveHeight / 2;

        // Calculate distance from effective hitbox center to mouse
        const dx = mouseX - effectiveHitboxCenterX;
        const dy = mouseY - effectiveHitboxCenterY;

        console.log(
            `Effective hitbox center: (${effectiveHitboxCenterX}, ${effectiveHitboxCenterY}), dx: ${dx}, dy: ${dy}`
        );

        console.log(
            `Effective width: ${effectiveWidth}, half: ${effectiveWidth / 2}`
        );
        console.log(
            `Effective height: ${effectiveHeight}, half: ${effectiveHeight / 2}`
        );
        const isWithinMeleeRangeX = Math.abs(dx) < effectiveWidth / 2;
        const isWithinMeleeRangeY = Math.abs(dy) < effectiveHeight / 2;
        const isWithinMeleeRange = isWithinMeleeRangeX && isWithinMeleeRangeY;

        console.log(
            `Melee range X: ${isWithinMeleeRangeX}, Y: ${isWithinMeleeRangeY}`
        );

        // Set the attack type (melee or ranged)
        this.isRangedAttack = !isWithinMeleeRange;

        console.log(`Attack type: ${this.isRangedAttack ? "RANGED" : "MELEE"}`);

        // If it's a ranged attack, calculate the angle
        if (this.isRangedAttack) {
            // Set character direction based on mouse position
            if (dx >= 0) {
                this.direction = "right";
            } else {
                this.direction = "left";
            }

            // Calculate initial angle from player center to mouse for fire socket calculation
            const initialAngle = Math.atan2(dy, dx);

            // Use the unified fire socket calculation
            const fireSocketInfo =
                this.calculateFireSocketPosition(initialAngle);
            const fireSocketX = fireSocketInfo.x;
            const fireSocketY = fireSocketInfo.y;

            // Calculate final angle from fire socket to mouse (more accurate)
            const socketDx = mouseX - fireSocketX;
            const socketDy = mouseY - fireSocketY;
            this.rangedAttackAngle = Math.atan2(socketDy, socketDx);

            console.log(`Fire socket: (${fireSocketX}, ${fireSocketY})`);
            console.log(
                `Ranged attack angle: ${this.rangedAttackAngle} radians, ${
                    this.rangedAttackAngle * (180 / Math.PI)
                } degrees`
            );
            console.log(`Character facing: ${this.direction}`);

            // Return result of ranged attack
            return this.performRangedAttack();
        } else {
            // Return result of melee attack
            return this.performMeleeAttack();
        }
    }

    // Legacy method for backward compatibility
    meleeAttack() {
        const result = this.performMeleeAttack();
        return result.success;
    }

    // Method to perform melee attack
    performMeleeAttack() {
        // Check if attack is on cooldown
        if (this.isAttacking || this.currentAttackCooldown > 0) {
            console.log(
                "Melee Attack blocked: Already attacking or on cooldown"
            );
            return { success: false, isRanged: false };
        }

        // Set attacking flag
        this.isAttacking = true;

        // Set the current attack type
        this.currentAttackType = this.attackSequence[this.attackIndex];

        // Cycle to the next attack in the sequence for next time
        this.attackIndex = (this.attackIndex + 1) % this.attackSequence.length;

        try {
            // Set animation to melee attack
            const meleeAnimPath = `melee.${this.currentAttackType}`;

            // Verify the animation exists before setting it
            let anim;
            if (
                this.animations["melee"] &&
                this.animations["melee"][this.currentAttackType]
            ) {
                anim = this.animations["melee"][this.currentAttackType];
            }

            if (!anim || !anim.loop || !anim.loop[0] || !anim.loop[1]) {
                // If animation doesn't exist or is invalid, reset to ready state
                this.isAttacking = false;
                this.currentAnimation = "ready";
                this.state = "looping";
                this.loadAnimationSequence("loop");
                return { success: false, isRanged: false }; // Return false to indicate attack was not started
            }

            // Start the attack animation - use the loop sequence
            this.currentAnimation = meleeAnimPath;
            this.state = "looping";
            this.loadAnimationSequence("loop");

            // Reset animation counters
            this.currentFrameIndex = 0;
            this.frameCount = 0;

            // Reset the basic attack cooldown
            this.currentAttackCooldown = this.basicAttackCooldownMax;

            return { success: true, isRanged: false }; // Return true to indicate attack was successfully started
        } catch (e) {
            // If any error occurs, reset to ready state
            this.isAttacking = false;
            this.currentAnimation = "ready";
            this.state = "looping";
            this.loadAnimationSequence("loop");
            return { success: false, isRanged: false }; // Return false to indicate attack was not started
        }
    }

    // Method to perform ranged attack
    performRangedAttack() {
        console.log("Performing ranged attack");

        // Check if attack is on cooldown
        if (this.isAttacking || this.currentAttackCooldown > 0) {
            console.log(
                "Ranged Attack blocked: Already attacking or on cooldown"
            );
            return { success: false, isRanged: true }; // Return true for isRanged for consistency
        }

        // Set attacking flag
        this.isAttacking = true;

        // Set the current attack type
        this.currentAttackType = this.attackSequence[this.attackIndex];
        console.log(
            `Attack sequence index: ${this.attackIndex}, type: ${this.currentAttackType}`
        );

        // Cycle to the next attack in the sequence for next time
        this.attackIndex = (this.attackIndex + 1) % this.attackSequence.length;

        try {
            // Determine which ranged animation to use based on angle
            let rangedType = "default";
            const angle = this.rangedAttackAngle * (180 / Math.PI); // Convert to degrees
            console.log(`Selecting animation for angle: ${angle} degrees`);

            // Fixed angle-to-animation mapping
            // First, handle the vertical cases
            if (angle > -110 && angle < -70) {
                rangedType = "up_90"; // Shooting straight up
            } else if (angle > 70 && angle < 110) {
                rangedType = "down_90"; // Shooting straight down
            }
            // Then handle the diagonal cases
            else if (angle >= -70 && angle < -20) {
                rangedType = "up_45"; // Shooting up at 45 degrees
            } else if (angle >= -20 && angle <= 20) {
                rangedType = "default"; // Shooting straight left/right
            } else if (angle > 20 && angle <= 70) {
                rangedType = "down_45"; // Shooting down at 45 degrees
            } else if (angle > 110 && angle <= 160) {
                rangedType = "down_45"; // Shooting down at 45 degrees (other side)
            } else if (angle > 160 || angle <= -110) {
                rangedType = "default"; // Shooting straight left/right (other side)
            }

            console.log(`Selected ranged animation type: ${rangedType}`);

            // Set animation to ranged attack
            const rangedAnimPath = `ranged.${rangedType}`;
            console.log(`Animation path: ${rangedAnimPath}`);

            // Verify the animation exists before setting it
            let anim;
            if (
                this.animations["ranged"] &&
                this.animations["ranged"][rangedType]
            ) {
                anim = this.animations["ranged"][rangedType];
                console.log(`Found animation for ${rangedType}`);
            } else {
                console.log(`No animation found for ${rangedType}`);
            }

            if (!anim || !anim.loop || !anim.loop[0] || !anim.loop[1]) {
                console.log(
                    `Animation invalid or missing loop frames, trying default`
                );
                // If specific ranged animation doesn't exist, try default
                if (
                    this.animations["ranged"] &&
                    this.animations["ranged"]["default"] &&
                    this.animations["ranged"]["default"].loop &&
                    this.animations["ranged"]["default"].loop[0] &&
                    this.animations["ranged"]["default"].loop[1]
                ) {
                    anim = this.animations["ranged"]["default"];
                    rangedType = "default";
                    console.log(`Using default ranged animation instead`);
                    // Use the updated ranged type
                    const updatedRangedAnimPath = `ranged.${rangedType}`;
                    this.currentAnimation = updatedRangedAnimPath;
                } else {
                    console.log(
                        `No default ranged animation found, falling back to melee`
                    );
                    // If ranged animation doesn't exist at all, fall back to melee animation
                    return this.performMeleeAttack();
                }
            }

            // Ensure all sprites for this animation are loaded
            this.preloadRangedAnimationSprites(rangedType);

            // Start the attack animation - use the loop sequence
            this.currentAnimation = rangedAnimPath;
            this.state = "looping";
            console.log(
                `Setting animation: ${this.currentAnimation}, state: ${this.state}`
            );

            // Log the animation frames we're about to load
            if (
                this.animations["ranged"] &&
                this.animations["ranged"][rangedType] &&
                this.animations["ranged"][rangedType].loop
            ) {
                console.log(
                    `Animation frames: ${JSON.stringify(
                        this.animations["ranged"][rangedType].loop
                    )}`
                );
            }

            this.loadAnimationSequence("loop");
            console.log(`Loaded animation sequence`);

            // Reset animation counters
            this.currentFrameIndex = 0;
            this.frameCount = 0;

            // Reset the basic attack cooldown
            this.currentAttackCooldown = this.basicAttackCooldownMax;

            return {
                success: true,
                isRanged: true,
                angle: this.rangedAttackAngle,
                attackType: this.currentAttackType,
            };
        } catch (e) {
            console.error("Error in ranged attack:", e);
            // If any error occurs, reset to ready state
            this.isAttacking = false;
            this.currentAnimation = "ready";
            this.state = "looping";
            this.loadAnimationSequence("loop");
            return { success: false, isRanged: false }; // Return false to indicate attack was not started
        }
    }

    // Helper method to ensure all sprites for a ranged animation are loaded
    preloadRangedAnimationSprites(rangedType) {
        try {
            if (
                this.animations["ranged"] &&
                this.animations["ranged"][rangedType] &&
                this.animations["ranged"][rangedType].loop &&
                this.animations["ranged"][rangedType].loop[0] &&
                this.animations["ranged"][rangedType].loop[1]
            ) {
                const sequence = this.animations["ranged"][rangedType].loop;
                const startPath = sequence[0];
                const endPath = sequence[1];

                if (startPath && endPath) {
                    // Extract frame numbers
                    const startFrameStr = startPath.split("/").pop();
                    const endFrameStr = endPath.split("/").pop();

                    if (startFrameStr && endFrameStr) {
                        const startFrame = parseInt(
                            startFrameStr.substring(
                                0,
                                startFrameStr.indexOf(".")
                            )
                        );
                        const endFrame = parseInt(
                            endFrameStr.substring(0, endFrameStr.indexOf("."))
                        );

                        if (
                            !isNaN(startFrame) &&
                            !isNaN(endFrame) &&
                            startFrame <= endFrame
                        ) {
                            console.log(
                                `Preloading ranged animation frames ${startFrame} to ${endFrame}`
                            );

                            // Force load each sprite in the sequence
                            for (let i = startFrame; i <= endFrame; i++) {
                                const path = `assets/player/${this.characterFolder}/${i}.svg`;

                                // Check if sprite is already loaded
                                if (
                                    !this.sprites[path] ||
                                    !this.sprites[path].complete
                                ) {
                                    console.log(`Preloading sprite: ${path}`);
                                    const img = new Image();
                                    img.src = path;
                                    this.sprites[path] = img;
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error preloading ranged animation sprites:", e);
        }
    }
}

export default Player;
