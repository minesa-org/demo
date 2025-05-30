class Projectile {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        angle,
        characterType,
        attackType = "first"
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.angle = angle; // in radians
        this.renderAngle = angle + Math.PI / 2; // Add 90 degrees (π/2 radians) for rendering
        this.characterType = characterType.toLowerCase();
        this.attackType = attackType;

        // Calculate velocity based on angle and speed
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        // Animation properties
        this.frameDelay = 2;
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sprites = {};
        this.frames = [];
        this.active = true;

        // Special case for mage's third attack
        this.isDoubleFireball =
            this.characterType === "mage" && this.attackType === "third";

        // Load the appropriate projectile sprites
        this.loadSprites();
    }

    loadSprites() {
        this.frames = [];
        this.sprites = {};
        this.currentFrameIndex = 0;
        this.frameDelay = 3; // Frames to wait before advancing animation
        this.frameCounter = 0;
        this.active = true;

        // Determine the correct animation path based on character type and attack type
        let animationPath = "";

        if (this.characterType === "mage") {
            // For mage, use different animations based on attack type
            if (this.attackType === "third") {
                animationPath = "assets/projectiles/mage/fireball_double/";
                // Double fireball is wider
                this.width = 58.67;
                this.height = 74.67;
            } else {
                animationPath = "assets/projectiles/mage/fireball_single/";
                // Single fireball is narrower
                this.width = 37.33;
                this.height = 70.67;
            }
        } else if (this.characterType === "paladin") {
            animationPath = "assets/projectiles/paladin/";
        } else {
            // Default to rogue
            animationPath = "assets/projectiles/rogue/";
            this.width = 22.75;
            this.height = 96.75;
        }

        // Paladin has 18, mage has 12 and rogue has 28 frames
        const numFrames =
            this.characterType === "rogue"
                ? 28
                : this.characterType === "paladin"
                ? 18
                : 12;
        for (let i = 1; i <= numFrames; i++) {
            const framePath = `${animationPath}${i}.svg`;
            this.frames.push(framePath);

            // Create and load the sprite
            const sprite = new Image();
            sprite.src = framePath;
            this.sprites[framePath] = sprite;
        }
    }

    loadSprite(path) {
        if (!this.sprites[path]) {
            const sprite = new Image();
            sprite.src = path;
            this.sprites[path] = sprite;
        }
    }

    update() {
        // Update position based on velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update animation
        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.currentFrameIndex =
                (this.currentFrameIndex + 1) % this.frames.length;
        }

        // Check if projectile is out of bounds (simple check for now)
        if (
            this.x < -this.width ||
            this.x > 1280 + this.width ||
            this.y < -this.height ||
            this.y > 720 + this.height
        ) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active || this.frames.length === 0) return;

        const framePath = this.frames[this.currentFrameIndex];
        const sprite = this.sprites[framePath];

        if (sprite && sprite.complete) {
            ctx.save();

            // Translate to the projectile's position
            ctx.translate(this.x, this.y);

            // Rotate to match the projectile's render angle (90 degrees offset)
            ctx.rotate(this.renderAngle);

            // Draw the projectile centered on its position
            ctx.drawImage(
                sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            // Debug: draw hitbox
            if (window.showHitboxes) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height
                );
            }

            ctx.restore();
        }
    }

    // Check if this projectile collides with a target
    checkCollision(target) {
        // Simple rectangular collision detection
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        const projectileLeft = this.x - halfWidth;
        const projectileRight = this.x + halfWidth;
        const projectileTop = this.y - halfHeight;
        const projectileBottom = this.y + halfHeight;

        const targetLeft = target.x;
        const targetRight = target.x + target.width;
        const targetTop = target.y;
        const targetBottom = target.y + target.height;

        return (
            projectileRight >= targetLeft &&
            projectileLeft <= targetRight &&
            projectileBottom >= targetTop &&
            projectileTop <= targetBottom
        );
    }
}

export default Projectile;
