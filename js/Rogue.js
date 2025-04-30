import Player from "./Player.js";

class Rogue extends Player {
    constructor(x, y) {
        const width = 958.875;
        const height = 666.225;
        const frameDelay = 2;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Rogue";
        this.jsonPath = "assets/player/rogue.json";

        this.loadAnimations(this.jsonPath, this.characterFolder);
    }
    moveLeft() {
        super.moveLeft();
        if (this.currentAnimation === "ready") {
            this.setAnimation("walk", this.characterFolder);
        }
    }

    moveRight() {
        super.moveRight();
        if (this.currentAnimation === "ready") {
            this.setAnimation("walk", this.characterFolder);
        }
    }

    moveUp() {
        super.moveUp();
        if (this.currentAnimation === "ready") {
            this.setAnimation("walk", this.characterFolder);
        }
    }

    moveDown() {
        super.moveDown();
        if (this.currentAnimation === "ready") {
            this.setAnimation("walk", this.characterFolder);
        }
    }

    stopX() {
        super.stopX();
        if (this.velocityY === 0 && this.currentAnimation === "walk") {
            this.setAnimation("ready", this.characterFolder);
        }
    }

    stopY() {
        super.stopY();
        if (this.velocityX === 0 && this.currentAnimation === "walk") {
            this.setAnimation("ready", this.characterFolder);
        }
    }

    attack() {
        super.attack();
        this.setAnimation("attack", this.characterFolder);
    }
}

export default Rogue;
