import Player from "./Player.js";

class Mage extends Player {
    constructor(x, y) {
        const width = 221.21;
        const height = 383.7;
        const frameDelay = 1.8;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Mage";
        this.jsonPath = "assets/player/mage.json";

        // Set effective width to 95.95 for all characters
        this.effectiveWidthRatio = this.calculateEffectiveWidthRatio(95.95);
        this.effectiveWidthOffset = 0.375;

        this.loadAnimations(this.jsonPath, this.characterFolder);
    }

    // Override the renderShadow method to fix shadow position for Mage
    renderShadow(ctx) {
        // Don't render shadow if jumping
        if (this.isJumping) {
            return;
        }

        // Adjust shadow width to match character's width
        const shadowWidth = this.width * this.effectiveWidthRatio * 0.8;
        const shadowHeight = shadowWidth * 0.25;

        // Center the shadow under the character
        let shadowX = this.x + this.width / 2;

        // Position the shadow at the bottom of the character's feet
        const shadowY = this.y + this.height * 0.57;

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
}

export default Mage;
