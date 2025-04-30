import Player from "./Player.js";

class Paladin extends Player {
    constructor(x, y) {
        const width = 639.65;
        const height = 729.7;
        const frameDelay = 6;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Paladin";
        this.jsonPath = "assets/player/paladin.json";

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

export default Paladin;
