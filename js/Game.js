import Mage from "./Mage.js";
import Paladin from "./Paladin.js";
import Rogue from "./Rogue.js";
import Cloud from "./Cloud.js";
import Boat from "./Boat.js";
import Wave from "./Wave.js";

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.player = null;
        this.keys = {};
        this.lastTime = 0;
        this.gameRunning = true;
        this.backgroundImage = null;
        this.clouds = [];
        this.cloudJsonPath = "assets/lost_at_sea/clouds.json";
        this.boat = null;
        this.boatJsonPath = "assets/lost_at_sea/boat.json";
        this.backWaves = [];
        this.frontWaves = [];
        this.waveJsonPath = "assets/lost_at_sea/sea_wave.json";
    }

    init() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));

        this.loadBackgroundImage();
        this.createClouds();
        this.createWaves();
        this.createBoat();
    }

    async createWaves() {
        const waveHeight = 90;
        const waveWidth = 416;
        const numWavesNeeded = Math.ceil(this.canvas.width / waveWidth) + 1;

        for (let i = 0; i < numWavesNeeded; i++) {
            const x = i * (waveWidth - 10);
            const y = this.canvas.height - waveHeight + 25;
            const initialDelay = Math.floor(Math.random() * 5);
            const frameDelay = 3;

            const wave = new Wave(
                x,
                y,
                waveWidth,
                waveHeight,
                frameDelay,
                initialDelay
            );
            await wave.loadAnimations(this.waveJsonPath);
            this.backWaves.push(wave);
        }

        for (let i = 0; i < numWavesNeeded; i++) {
            const x = i * (waveWidth - 20);
            const y = this.canvas.height - waveHeight + 55;
            const initialDelay = Math.floor(Math.random() * 5);
            const frameDelay = 3;

            const wave = new Wave(
                x,
                y,
                waveWidth,
                waveHeight,
                frameDelay,
                initialDelay
            );
            await wave.loadAnimations(this.waveJsonPath);
            this.frontWaves.push(wave);
        }
    }

    async createBoat() {
        const originalWidth = 217.75;
        const originalHeight = 248.95;
        const aspectRatio = originalWidth / originalHeight;
        const boatWidth = this.canvas.width * 0.8;
        const boatHeight = boatWidth / aspectRatio;
        const boatX = (this.canvas.width - boatWidth) / 2;
        const boatY = this.canvas.height - boatHeight * 0.5;

        this.boat = new Boat(boatX, boatY, boatWidth, boatHeight * 0.5);
        await this.boat.loadImage(this.boatJsonPath);
    }

    async createClouds() {
        const purpleCloudsConfig = [
            {
                x: 50,
                y: 100,
                width: 275,
                height: 85,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: 250,
                y: 100,
                width: 275,
                height: 80,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: 450,
                y: 100,
                width: 275,
                height: 80,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: 650,
                y: 100,
                width: 275,
                height: 80,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: 50,
                y: 50,
                width: 300,
                height: 90,
                depth: 0.9,
                frameDelay: 20,
            },
            {
                x: 300,
                y: 50,
                width: 300,
                height: 90,
                depth: 0.9,
                frameDelay: 20,
            },
            {
                x: 550,
                y: 50,
                width: 300,
                height: 90,
                depth: 0.9,
                frameDelay: 20,
            },
        ];

        const grayCloudsConfig = [
            {
                x: 0,
                y: 0,
                width: 400,
                height: 95,
                depth: 1.2,
                frameDelay: 20,
            },
            {
                x: 300,
                y: 0,
                width: 375,
                height: 90,
                depth: 1.2,
                frameDelay: 25,
            },
            {
                x: 600,
                y: 0,
                width: 390,
                height: 92,
                depth: 1.2,
                frameDelay: 20,
            },
        ];

        for (let i = 0; i < purpleCloudsConfig.length; i++) {
            const config = purpleCloudsConfig[i];
            const initialDelay = 20 * i + Math.floor(Math.random() * 30);

            const cloud = new Cloud(
                config.x,
                config.y,
                config.width * config.depth,
                config.height * config.depth,
                "purple",
                config.frameDelay,
                initialDelay
            );
            await cloud.loadAnimations(this.cloudJsonPath);
            this.clouds.push(cloud);
        }

        for (let i = 0; i < grayCloudsConfig.length; i++) {
            const config = grayCloudsConfig[i];
            const initialDelay = 35 * i + Math.floor(Math.random() * 40);

            const cloud = new Cloud(
                config.x,
                config.y,
                config.width * config.depth,
                config.height * config.depth,
                "gray",
                config.frameDelay,
                initialDelay
            );
            await cloud.loadAnimations(this.cloudJsonPath);
            this.clouds.push(cloud);
        }
    }

    async loadBackgroundImage() {
        try {
            console.log("Loading background image...");
            const response = await fetch("assets/lost_at_sea/background.json");
            if (!response.ok) {
                throw new Error("Failed to load background data");
            }

            const backgroundData = await response.json();
            console.log("Background data loaded:", backgroundData);

            if (backgroundData.background_image) {
                this.backgroundImage = new Image();
                this.backgroundImage.src = backgroundData.background_image;
                console.log(
                    "Background image path set to:",
                    this.backgroundImage.src
                );

                // Add an onload handler to confirm when the image is loaded
                this.backgroundImage.onload = () => {
                    console.log(
                        "Background image loaded successfully, dimensions:",
                        this.backgroundImage.width,
                        "x",
                        this.backgroundImage.height
                    );
                };

                // Add an onerror handler to detect loading failures
                this.backgroundImage.onerror = () => {
                    console.error(
                        "Failed to load background image from path:",
                        this.backgroundImage.src
                    );
                };
            }
        } catch (error) {
            console.error("Error loading background image:", error);
        }
    }

    createPlayer(characterType = "rogue") {
        console.log("Creating player of type:", characterType);
        let player;

        switch (characterType.toLowerCase()) {
            case "paladin":
                player = new Paladin(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50; // Position player on the boat deck
                this.player = player;
                console.log(
                    "Paladin created at position:",
                    player.x,
                    player.y,
                    "with dimensions:",
                    player.width,
                    "x",
                    player.height
                );
                break;

            case "rogue":
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50; // Position player on the boat deck
                this.player = player;
                console.log(
                    "Rogue created at position:",
                    player.x,
                    player.y,
                    "with dimensions:",
                    player.width,
                    "x",
                    player.height
                );
                break;

            case "mage":
                player = new Mage(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50; // Position player on the boat deck
                this.player = player;
                console.log(
                    "Mage created at position:",
                    player.x,
                    player.y,
                    "with dimensions:",
                    player.width,
                    "x",
                    player.height
                );
                break;

            default:
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                console.log(
                    "Default Rogue created at position:",
                    player.x,
                    player.y,
                    "with dimensions:",
                    player.width,
                    "x",
                    player.height
                );
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

        for (const cloud of this.clouds) {
            cloud.update();
        }

        for (const wave of this.backWaves) {
            wave.update(this.canvas.width);
        }

        for (const wave of this.frontWaves) {
            wave.update(this.canvas.width);
        }

        if (this.boat) {
            this.boat.update();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#0e031b";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.backgroundImage && this.backgroundImage.complete) {
            const bgRatio =
                this.backgroundImage.width / this.backgroundImage.height;
            const canvasRatio = this.canvas.width / this.canvas.height;

            let drawWidth,
                drawHeight,
                offsetX = 0,
                offsetY = 0;

            if (canvasRatio > bgRatio) {
                drawWidth = this.canvas.width;
                drawHeight = drawWidth / bgRatio;
                offsetY = (this.canvas.height - drawHeight) / 2;
            } else {
                drawHeight = this.canvas.height;
                drawWidth = drawHeight * bgRatio;
                offsetX = (this.canvas.width - drawWidth) / 2;
            }

            this.ctx.drawImage(
                this.backgroundImage,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight
            );
        }

        const purpleClouds = this.clouds.filter(
            (cloud) => cloud.type === "purple"
        );
        const grayClouds = this.clouds.filter((cloud) => cloud.type === "gray");

        for (const cloud of purpleClouds) {
            cloud.render(this.ctx);
        }

        for (const cloud of grayClouds) {
            cloud.render(this.ctx);
        }

        for (const wave of this.backWaves) {
            wave.render(this.ctx);
        }

        if (this.boat) {
            this.boat.render(this.ctx);
        }

        for (const wave of this.frontWaves) {
            wave.render(this.ctx);
        }

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
