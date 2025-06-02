class Goblin {
    constructor(x, y, width = 194, height = 165) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Effective width for collision detection (smaller than visual width)
        this.effectiveWidthRatio = 0.3; // 30% of visual width // 40% of visual width
        this.effectiveHeightRatio = 0.45; // 45% of visual height // 60% of visual height

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
        this.direction = "left"; // Varsayılan yön sol olarak değiştirildi

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

        this.attackDelay = 120; // 2 saniye bekleme (60fps * 2)
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.attackDuration = 40;
        this.currentMeleeAttack = 0;
        this.meleeAttackSequence = ["first", "second", "third"];
        this.dieSound = new Audio("assets/audio/goblin_die.wav");
        this.dieSound.volume = 0.7;

        this.targetPlayer = null;

        this.sprites = {};
        this.loadedSprites = new Set();

        this.groundY = y;
        this.initialY = y; // Store initial Y position
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

        if (this.state === "koed") {
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

        if (this.hitReactTimer > 0) {
            this.state = "hit_react";
            this.velocityX = 0;
            this.updateAnimation();
            return;
        }

        if (this.isAttacking) {
            this.state = "melee";
            this.velocityX = 0;

            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.state = "ready";
            }

            this.updateAnimation();
            return;
        }

        if (player && this.health > 0) {
            const distanceToPlayer = this.getDistanceToPlayer(player);
            this.targetPlayer = player;

            if (distanceToPlayer <= this.detectionRange) {
                if (
                    distanceToPlayer <= this.attackRange &&
                    this.attackTimer <= 0
                ) {
                    this.startAttack();
                } else if (distanceToPlayer > this.attackRange) {
                    this.moveTowardsPlayer(player);
                    this.state = "run";
                } else {
                    this.state = "ready";
                    this.velocityX = 0;
                }
            } else {
                this.state = "ready";
                this.velocityX = 0;
            }
        }

        this.x += this.velocityX;

        // Update ground position to match player's bottom height
        this.updateGroundPosition(player);

        // Saldırı gecikmesini güncelle
        if (this.lastAttackTime > 0) {
            this.lastAttackTime--;
        }

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

        this.direction = dx >= 0 ? "left" : "right"; // Yön mantığı tersine çevrildi

        if (Math.abs(dx) > 5) {
            this.velocityX = this.moveSpeed * Math.sign(dx);
        } else {
            this.velocityX = 0;
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.attackTimer = this.attackCooldown;
        this.state = "melee";
        this.animationPhase = "loop";
        this.phaseFrameIndex = 0;

        // Changed to 3 attacks instead of 4
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
            this.velocityX = 0;
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
    updateGroundPosition() {
        this.y = this.groundY;
    }

    canAttackPlayer(player) {
        if (
            !this.isAttacking ||
            !player ||
            this.isDead ||
            this.lastAttackTime > 0
        ) {
            return false;
        }

        const distance = this.getDistanceToPlayer(player);
        if (distance <= this.attackRange) {
            this.lastAttackTime = this.attackDelay;
            return true;
        }
        return false;
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
            // Sağa giderken çevir
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                -this.x - this.width,
                this.y,
                this.width,
                this.height
            );
        } else {
            // Sola giderken normal çiz
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
        ctx.restore();

        // Only draw hitboxes if the goblin is alive and debug mode is on
        if (window.showHitboxes && !this.isDead) {
            // Draw full sprite box
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Draw effective hitbox
            const effectiveWidth = this.width * this.effectiveWidthRatio;
            const effectiveHeight = this.height * this.effectiveHeightRatio;
            const effectiveX = this.x + (this.width - effectiveWidth) / 2;
            const effectiveY = this.y + (this.height - effectiveHeight) / 2;

            // Only show hit detection boxes for alive goblins
            if (!this.isDead) {
                ctx.strokeStyle = "green";
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    effectiveX,
                    effectiveY,
                    effectiveWidth,
                    effectiveHeight
                );

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
}

export default Goblin;
