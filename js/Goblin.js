class Goblin {
    constructor(x, y, width = 194, height = 165) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Effective width for collision detection (smaller than visual width)
        this.effectiveWidthRatio = 0.25; // 25% of visual width
        this.effectiveHeightRatio = 0.35; // 35% of visual height
        this.verticalOffset = 35; // Pixels to offset sprite upward to center with hitbox

        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.isDead = false;
        this.shouldRemove = false;

        this.state = "ready";
        this.detectionRange = 200;
        this.attackRange = 100;
        this.moveSpeed = 1.5;

        this.velocityX = 0;
        this.velocityY = 0;
        this.direction = "left";

        this.animations = {};
        this.frameCounter = 0;
        this.frameDelay = 4;
        this.animationPhase = "loop";
        this.phaseFrameIndex = 0;

        this.hitReactTimer = 0;
        this.hitReactDuration = 30;

        this.koTimer = 0;
        this.koDuration = 300;
        this.fadeAlpha = 1.0;
        this.fadeSpeed = 0.005;

        // Attack related properties
        this.attackTimer = 0;
        this.attackCooldown = 120; // 2 seconds at 60fps
        this.attackDuration = 40; // Time each attack animation plays
        this.isAttacking = false;
        this.currentMeleeAttack = 0;
        this.meleeAttackSequence = ["first", "second", "third"];
        this.canAttack = true; // New flag to manage attack availability

        this.dieSound = new Audio("assets/audio/goblin_die.wav");
        this.dieSound.volume = 0.7;

        this.targetPlayer = null;
        this.groundY = y;
        this.initialY = y;

        // Height positioning properties
        this.heightLevel = Math.random() < 0.5 ? 0 : 1; // Randomly assign level 0 or 1
        this.heightOffset = 5; // 5 pixels offset for level 1

        // Death animation properties
        this.deathVelocityX = 0;
        this.deathVelocityY = 0;
        this.gravity = 0.5;
        this.throwSpeed = 8;
        this.bounceCount = 0;
        this.maxBounces = 2;
        this.bounceDamping = 0.6;

        this.sprites = {};
        this.loadedSprites = new Set();
    }

    async loadAnimations(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            this.animations = data;
            await this.loadAllSprites();
        } catch (error) {
            console.error("Error loading goblin animations:", error);
        }
    }

    async loadAllSprites() {
        const spritesToLoad = new Set();

        for (const animName in this.animations) {
            const anim = this.animations[animName];

            if (animName === "melee") {
                for (const attackType in anim) {
                    const attack = anim[attackType];
                    this.collectSpritePaths(attack, spritesToLoad);
                }
            } else {
                this.collectSpritePaths(anim, spritesToLoad);
            }
        }

        const loadPromises = Array.from(spritesToLoad).map((path) =>
            this.loadSprite(path)
        );
        await Promise.all(loadPromises);
    }

    collectSpritePaths(animData, spritesToLoad) {
        const phases = ["start", "loop", "end"];
        for (const phase of phases) {
            if (animData[phase] && animData[phase][0] && animData[phase][1]) {
                const framePaths = this.getFramePaths(
                    animData[phase][0],
                    animData[phase][1]
                );
                framePaths.forEach((path) => {
                    if (!spritesToLoad.has(path)) {
                        spritesToLoad.add(path);
                    }
                });
            }
        }
    }

    getFramePaths(startPath, endPath) {
        const startMatch = startPath.match(/\d+/);
        const endMatch = endPath.match(/\d+/);

        if (!startMatch || !endMatch) {
            return [];
        }

        const startNum = parseInt(startMatch[0]);
        const endNum = parseInt(endMatch[0]);

        const lastSlashIndex = startPath.lastIndexOf("/");
        const lastDotIndex = startPath.lastIndexOf(".");
        const basePath = startPath.substring(0, lastSlashIndex + 1);
        const extension = startPath.substring(lastDotIndex);

        const frames = [];
        const minNum = Math.min(startNum, endNum);
        const maxNum = Math.max(startNum, endNum);

        for (let i = minNum; i <= maxNum; i++) {
            frames.push(`${basePath}${i}${extension}`);
        }
        return frames;
    }

    async loadSprite(path) {
        if (this.loadedSprites.has(path)) {
            return;
        }
        this.loadedSprites.add(path);

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[path] = img;
                resolve();
            };
            img.onerror = () => {
                resolve();
            };

            const correctedPath = `assets/enemy/${path.replace("../", "")}`;
            img.src = correctedPath;
        });
    }

    update(player) {
        if (this.hitReactTimer > 0) {
            this.hitReactTimer--;
        }

        if (this.attackTimer > 0) {
            this.attackTimer--;
        }

        // Handle death animation
        if (this.isDead) {
            // Apply gravity
            this.deathVelocityY += this.gravity;

            // Update position
            this.x += this.deathVelocityX;
            this.y += this.deathVelocityY;

            // Check for ground collision
            const maxY = this.groundY;
            if (this.y > maxY) {
                this.y = maxY;

                if (this.bounceCount < this.maxBounces) {
                    // Bounce with reduced velocity
                    this.deathVelocityY =
                        -this.deathVelocityY * this.bounceDamping;
                    this.deathVelocityX *= this.bounceDamping;
                    this.bounceCount++;
                } else {
                    // Stop movement after max bounces
                    this.deathVelocityX = 0;
                    this.deathVelocityY = 0;
                }
            }

            this.koTimer++;
            if (this.koTimer >= this.koDuration) {
                this.fadeAlpha -= this.fadeSpeed;
                if (this.fadeAlpha <= 0) {
                    this.shouldRemove = true;
                }
            }

            this.updateAnimation();
            return;
        }

        // Handle hit reaction
        if (this.hitReactTimer > 0) {
            this.state = "hit_react";
            this.velocityX = 0;
            this.updateAnimation();
            return;
        }

        // Handle attack state
        if (this.isAttacking) {
            this.state = "melee";
            this.velocityX = 0;
            this.updateAnimation();
            return;
        }

        // Reset canAttack flag when attack cooldown is done
        if (!this.canAttack && this.attackTimer <= 0) {
            this.canAttack = true;
        }

        // Update behavior when player is present and goblin is alive
        if (player && this.health > 0) {
            const distanceToPlayer = this.getDistanceToPlayer(player);
            this.targetPlayer = player;

            if (distanceToPlayer <= this.detectionRange) {
                // In attack range and can attack
                if (
                    distanceToPlayer <= this.attackRange &&
                    this.canAttack &&
                    !this.isAttacking
                ) {
                    this.startAttack();
                    this.canAttack = false;
                }
                // Outside attack range but within detection - move towards player
                else if (distanceToPlayer > this.attackRange) {
                    this.moveTowardsPlayer(player);
                    this.state = "run";
                }
                // In attack range but can't attack - stay ready
                else {
                    this.state = "ready";
                    this.velocityX = 0;
                }
            } else {
                // Outside detection range - stay ready
                this.state = "ready";
                this.velocityX = 0;
            }
        }

        // Apply movement
        this.x += this.velocityX;

        // Update ground position
        this.updateGroundPosition(player);

        // Update animation
        this.updateAnimation();
    }

    getDistanceToPlayer(player) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        return Math.sqrt(
            Math.pow(centerX - playerCenterX, 2) +
                Math.pow(centerY - playerCenterY, 2)
        );
    }

    moveTowardsPlayer(player) {
        const centerX = this.x + this.width / 2;
        const playerCenterX = player.x + player.width / 2;
        const dx = playerCenterX - centerX;

        // Fix direction logic: face right when moving right, face left when moving left
        this.direction = dx > 0 ? "right" : "left";

        if (Math.abs(dx) > 5) {
            this.velocityX = this.moveSpeed * Math.sign(dx);
        } else {
            this.velocityX = 0;
        }
    }

    startAttack() {
        if (!this.canAttack || this.isAttacking) return;

        this.isAttacking = true;
        this.attackTimer = this.attackCooldown;
        this.state = "melee";
        this.animationPhase = "loop";
        this.phaseFrameIndex = 0;
        this.currentMeleeAttack = (this.currentMeleeAttack + 1) % 3;
    }

    takeDamage(damage = 1) {
        if (this.health <= 0) return false;

        this.health -= damage;

        this.hitReactTimer = this.hitReactDuration;
        this.state = "hit_react";
        this.animationPhase = "start";
        this.phaseFrameIndex = 0;

        if (this.health <= 0) {
            this.state = "koed";
            this.koTimer = 0;
            this.isDead = true;
            this.animationPhase = "start";
            this.phaseFrameIndex = 0;

            // Initialize throw out effect
            const throwAngle = Math.PI * 0.25; // 45 degrees upward
            this.deathVelocityX =
                this.throwSpeed *
                Math.cos(throwAngle) *
                (this.direction === "right" ? -1 : 1);
            this.deathVelocityY = -this.throwSpeed * Math.sin(throwAngle);

            // Play death sound
            this.dieSound.currentTime = 0;
            this.dieSound.play().catch(() => {
                /* Silently handle error */
            });
        }

        return true;
    }

    // Check if goblin is in range of player skills (like Paladin's smite)
    isInSkillRange(player, skillRange = 150) {
        if (!player) return false;

        const distance = this.getDistanceToPlayer(player);
        return distance <= skillRange;
    }

    // Update goblin's ground position to match player's bottom height
    updateGroundPosition(player) {
        if (player) {
            // Use player's initialY instead of current y position
            const baseY =
                player.initialY +
                player.height -
                this.height -
                this.verticalOffset;
            this.groundY = baseY - this.heightLevel * this.heightOffset;

            if (!this.isDead) {
                this.y = this.groundY;
            }
        }
    }

    canAttackPlayer(player) {
        if (!player || this.isDead || !this.canAttack || this.isAttacking) {
            return false;
        }

        const distance = this.getDistanceToPlayer(player);
        return distance <= this.attackRange;
    }

    checkCollision(projectile) {
        // Dead goblins can't be hit
        if (this.isDead) return false;

        // Use effective width/height for collision detection
        const effectiveWidth = this.width * this.effectiveWidthRatio;
        const effectiveHeight = this.height * this.effectiveHeightRatio;
        const effectiveX = this.x + (this.width - effectiveWidth) / 2;
        const effectiveY = this.y + (this.height - effectiveHeight) / 2;

        return (
            projectile.x < effectiveX + effectiveWidth &&
            projectile.x + projectile.width > effectiveX &&
            projectile.y < effectiveY + effectiveHeight &&
            projectile.y + projectile.height > effectiveY
        );
    }

    updateAnimation() {
        this.frameCounter++;

        if (this.frameCounter >= this.frameDelay) {
            this.frameCounter = 0;

            let animData = this.getAnimationData();
            if (!animData) {
                return;
            }

            const currentPhaseRange = animData[this.animationPhase];
            let currentPhaseFrames = [];
            if (
                currentPhaseRange &&
                currentPhaseRange[0] &&
                currentPhaseRange[1]
            ) {
                currentPhaseFrames = this.getFramePaths(
                    currentPhaseRange[0],
                    currentPhaseRange[1]
                );
            }

            if (currentPhaseFrames.length === 0) {
                this.advanceAnimationPhase(animData);
                return;
            }

            this.phaseFrameIndex++;

            if (this.phaseFrameIndex >= currentPhaseFrames.length) {
                this.advanceAnimationPhase(animData);
            }
        }
    }

    getAnimationData() {
        if (!this.animations) return null;

        if (this.state === "melee") {
            const meleeData = this.animations.melee;
            if (!meleeData) return null;

            const attackType =
                this.meleeAttackSequence[this.currentMeleeAttack];
            return meleeData[attackType];
        }

        return this.animations[this.state];
    }

    advanceAnimationPhase(animData) {
        if (this.animationPhase === "start") {
            this.animationPhase = "loop";
        } else if (this.animationPhase === "loop") {
            if (this.shouldEndAnimation()) {
                this.animationPhase = "end";
            } else {
                this.phaseFrameIndex = 0;
                return;
            }
        } else if (this.animationPhase === "end") {
            this.resetAnimationState();
            return;
        }

        this.phaseFrameIndex = 0;

        const newPhaseRange = animData[this.animationPhase];
        let newPhaseFrames = [];
        if (newPhaseRange && newPhaseRange[0] && newPhaseRange[1]) {
            newPhaseFrames = this.getFramePaths(
                newPhaseRange[0],
                newPhaseRange[1]
            );
        }

        if (newPhaseFrames.length === 0) {
            this.advanceAnimationPhase(animData);
        }
    }

    shouldEndAnimation() {
        if (this.state === "hit_react" || this.state === "koed") {
            return true;
        }
        if (this.state === "melee") {
            return (
                this.attackTimer <= this.attackCooldown - this.attackDuration
            );
        }
        return false;
    }

    resetAnimationState() {
        this.animationPhase = "loop";
        this.phaseFrameIndex = 0;

        if (this.state === "hit_react") {
            this.state = "ready";
        } else if (this.state === "melee") {
            this.isAttacking = false;
            this.state = "ready";
        }
    }

    getCurrentSprite() {
        const animData = this.getAnimationData();
        if (!animData) return null;

        const currentPhaseRange = animData[this.animationPhase];
        let currentPhaseFrames = [];
        if (currentPhaseRange && currentPhaseRange[0] && currentPhaseRange[1]) {
            currentPhaseFrames = this.getFramePaths(
                currentPhaseRange[0],
                currentPhaseRange[1]
            );
        }

        if (currentPhaseFrames.length === 0) return null;

        const frameIndex = Math.min(
            this.phaseFrameIndex,
            currentPhaseFrames.length - 1
        );
        const spritePath = currentPhaseFrames[frameIndex];

        return spritePath ? this.sprites[spritePath] : null;
    }

    render(ctx) {
        const sprite = this.getCurrentSprite();

        if (!sprite) {
            return;
        }

        if (this.state === "koed" && this.fadeAlpha < 1.0) {
            ctx.globalAlpha = Math.max(0, this.fadeAlpha);
        }

        ctx.save();
        if (this.direction === "right") {
            // Draw sprite flipped horizontally
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                -this.x - this.width,
                this.y,
                this.width,
                this.height
            );
        } else {
            // Draw sprite normally
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
        ctx.restore();

        // Only draw hitboxes if the goblin is alive and debug mode is on
        if (window.showHitboxes && !this.isDead) {
            // Draw effective hitbox
            const effectiveWidth = this.width * this.effectiveWidthRatio;
            const effectiveHeight = this.height * this.effectiveHeightRatio;
            const effectiveX = this.x + (this.width - effectiveWidth) / 2;
            const effectiveY =
                this.y +
                this.verticalOffset +
                (this.height - effectiveHeight) / 2;

            // Only show hit detection boxes for alive goblins
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                effectiveX,
                effectiveY,
                effectiveWidth,
                effectiveHeight
            );

            // Show full sprite box
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Show detection and attack ranges
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.detectionRange,
                0,
                2 * Math.PI
            );
            ctx.stroke();

            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.attackRange,
                0,
                2 * Math.PI
            );
            ctx.stroke();

            // Show debug info only for alive goblins
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(
                `HP: ${this.health}/${this.maxHealth}`,
                this.x,
                this.y - 5
            );
            ctx.fillText(`State: ${this.state}`, this.x, this.y - 20);
            ctx.fillText(
                `Phase: ${this.animationPhase} (${this.phaseFrameIndex})`,
                this.x,
                this.y - 35
            );
        }
    }
}

export default Goblin;
