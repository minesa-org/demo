import Player from "./Player.js";

class Mage extends Player {
    constructor(x, y) {
        const width = 221.21; // Half the original size for smaller canvas
        const height = 383.7; // Half the original size for smaller canvas
        const frameDelay = 1.8;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Mage";
        this.jsonPath = "assets/player/mage.json";

        // Mage-specific hitbox adjustments
        this.effectiveWidthRatio = 0.25; // Reduced effective width
        this.effectiveWidthOffset = 0.375; // Centered offset (calculated as (1 - ratio) / 2)

        this.loadAnimations(this.jsonPath, this.characterFolder);
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
}

export default Mage;
