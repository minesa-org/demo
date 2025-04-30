import Player from "./Player.js";

class Rogue extends Player {
    constructor(x, y) {
        const width = 479.44; // Half the original size for smaller canvas
        const height = 333.11; // Half the original size for smaller canvas
        const frameDelay = 2;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Rogue";
        this.jsonPath = "assets/player/rogue.json";

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

export default Rogue;
