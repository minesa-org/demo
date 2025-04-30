import Mage from "./Mage.js";
import Paladin from "./Paladin.js";
import Rogue from "./Rogue.js";

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.player = null;
        this.keys = {};
        this.lastTime = 0;
        this.gameRunning = true;
    }

    init() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));
    }

    createPlayer(characterType = "rogue") {
        let player;

        switch (characterType.toLowerCase()) {
            case "paladin":
                player = new Paladin(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = (this.canvas.height - player.height) / 2;
                this.player = player;
                break;

            case "rogue":
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = (this.canvas.height - player.height) / 2;
                this.player = player;
                break;

            case "mage":
                player = new Mage(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = (this.canvas.height - player.height) / 2;
                this.player = player;
                break;

            default:
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = (this.canvas.height - player.height) / 2;
                this.player = player;
                break;
        }
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    processInput() {
        if (this.keys["ArrowLeft"] || this.keys["a"]) {
            this.player.moveLeft();
        } else if (this.keys["ArrowRight"] || this.keys["d"]) {
            this.player.moveRight();
        } else {
            this.player.stopX();
        }

        if (this.keys["ArrowUp"] || this.keys["w"]) {
            this.player.moveUp();
        } else if (this.keys["ArrowDown"] || this.keys["s"]) {
            this.player.moveDown();
        } else {
            this.player.stopY();
        }
    }

    update() {
        if (this.player) {
            this.player.update();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.player) {
            this.player.render(this.ctx);
        }
    }

    gameLoop(timestamp) {
        this.lastTime = timestamp;

        this.processInput();
        this.update();
        this.render();

        if (this.gameRunning) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

export default Game;
