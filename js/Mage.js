import Player from "./Player.js";

class Mage extends Player {
    constructor(x, y) {
        const width = 221.21; 
        const height = 383.7; 
        const frameDelay = 1.8;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Mage";
        this.jsonPath = "assets/player/mage.json";

        
        this.effectiveWidthRatio = 0.25; 
        this.effectiveWidthOffset = 0.375;

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
