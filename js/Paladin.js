import Player from "./Player.js";

class Paladin extends Player {
    constructor(x, y) {
        const width = 319.83; // Half the original size for smaller canvas
        const height = 364.85; // Half the original size for smaller canvas
        const frameDelay = 2;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Paladin";
        this.jsonPath = "assets/player/paladin.json";

        // Paladin-specific hitbox adjustments
        this.effectiveWidthRatio = 0.3; // Reduced effective width
        this.effectiveWidthOffset = 0.1; // Centered offset (calculated as (1 - ratio) / 2)

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

export default Paladin;
