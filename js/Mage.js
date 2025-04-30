import Player from "./Player.js";

class Mage extends Player {
    constructor(x, y) {
        const width = 442.425;
        const height = 767.4;
        const frameDelay = 4;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Mage";
        this.jsonPath = "assets/player/mage.json";

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

export default Mage;
