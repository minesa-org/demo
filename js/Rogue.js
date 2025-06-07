import Player from "./Player.js";

class Rogue extends Player {
    constructor(x, y) {
        const width = 479.44;
        const height = 333.11;
        const frameDelay = 2;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Rogue";
        this.jsonPath = "assets/player/rogue.json";

        // Set effective width to 95.95 for all characters
        this.effectiveWidthRatio = this.calculateEffectiveWidthRatio(95.95);
        this.effectiveWidthOffset = 0.35;

        // Set effective height ratio for better attack detection
        this.effectiveHeightRatio = 0.4;

        // Increase movement speed by 1.2x
        this.speed = this.speed * 1.2;

        this.loadAnimations(this.jsonPath, this.characterFolder);
    }

    // Override the renderShadow method to fix shadow position for Rogue
    renderShadow(ctx) {
        // Don't render shadow if jumping
        if (this.isJumping) {
            return;
        }

        // Adjust shadow width to match character's width
        const shadowWidth = this.width * this.effectiveWidthRatio * 0.75;
        const shadowHeight = shadowWidth * 0.15;

        // Center the shadow under the character based on direction
        let shadowX;
        if (this.direction === "left") {
            // When facing left, adjust shadow position
            shadowX = this.x + this.width / 1.8;
        } else {
            // When facing right
            shadowX = this.x + this.width / 2.2;
        }

        // Position the shadow at the bottom of the character's feet
        const shadowY = this.y + this.height * 0.75;

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

    moveLeft() {
        super.moveLeft();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveRight() {
        super.moveRight();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveUp() {
        super.moveUp();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveDown() {
        super.moveDown();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    stopX() {
        super.stopX();
    }

    stopY() {
        super.stopY();
    }

    jump() {
        super.jump();
        if (this.currentAnimation === "ready") {
            this.setAnimation("jump", this.characterFolder);
        }
    }

    // Override setMovementBoundaries to maintain the 1.2x speed boost
    setMovementBoundaries(minX, maxX) {
        // Call the parent method to set up basic boundaries
        super.setMovementBoundaries(minX, maxX);

        // Apply the 1.2x speed boost after the parent method has set the speed
        this.speed = this.speed * 1.2;
    }
}

export default Rogue;
