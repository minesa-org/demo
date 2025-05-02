import Mage from "./Mage.js";
import Paladin from "./Paladin.js";
import Rogue from "./Rogue.js";
import Cloud from "./Cloud.js";
import Boat from "./Boat.js";
import Wave from "./Wave.js";
import Splash from "./Splash.js";
import Captain from "./Captain.js";

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
        this.splashes = [];
        this.splashJsonPath = "assets/lost_at_sea/splash.json";
        this.captain = null;
        this.captainJsonPath = "assets/lost_at_sea/captain.json";

        this.isPlayerMoving = false;
        this.movementSoundPlaying = false;

        this.playerBoundaries = {
            minX: 0,
            maxX: 0,
            set: false,
        };
    }

    async init() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));

        this.loadBackgroundImage();
        this.createClouds();
        this.createWaves();
        this.initMovementSound();

        await this.createBoat();
        await this.createSplash();
        await this.createCaptain();

        setTimeout(() => {
            if (this.boat) {
                if (!this.boat.loaded.player_ground) {
                    this.boat.sprites.player_ground = new Image();
                    this.boat.sprites.player_ground.src =
                        "./assets/lost_at_sea/boat/boat_player_ground.svg";
                    this.boat.sprites.player_ground.onload = () => {
                        this.boat.loaded.player_ground = true;
                    };
                }

                if (!this.boat.loaded.side_look) {
                    this.boat.sprites.side_look = new Image();
                    this.boat.sprites.side_look.src =
                        "./assets/lost_at_sea/boat/boat_side_look.svg";
                    this.boat.sprites.side_look.onload = () => {
                        this.boat.loaded.side_look = true;
                    };
                }

                this.boat.setVariant("side_look");

                if (this.player) {
                    this.adjustPlayerPosition();
                }

                if (this.captain) {
                    this.adjustCaptainPosition();
                }
            }
        }, 1000);
    }

    async createWaves() {
        const waveHeight = 90;
        const waveWidth = 416;
        const numWavesNeeded =
            Math.ceil(this.canvas.width / (waveWidth - 20)) + 2;

        for (let i = 0; i < numWavesNeeded; i++) {
            const x = i * (waveWidth - 10);
            const y = this.canvas.height - waveHeight + 10;
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
            const y = this.canvas.height - waveHeight + 60;
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
        const boatWidth = this.canvas.width * 0.8;
        const boatHeight = this.canvas.height * 0.7;
        const boatX = (this.canvas.width - boatWidth) / 2;
        const boatY = this.canvas.height - boatHeight * 0.9;

        this.boat = new Boat(boatX, boatY, boatWidth, boatHeight);
        await this.boat.loadImage(this.boatJsonPath);
    }

    async createSplash() {
        if (!this.boat) {
            return;
        }

        const boatX = this.boat.x;
        const boatY = this.boat.y;
        const boatWidth = this.boat.width;
        const boatHeight = this.boat.height;

        const sideLookSettings = this.boat.variantSettings.side_look;
        const sideLookWidth = boatWidth * sideLookSettings.scaleX;
        const sideLookX = boatX + boatWidth * sideLookSettings.offsetX;
        const sideLookRightEdge = sideLookX + sideLookWidth;
        const boatBottomY = boatY + boatHeight * 0.8;

        const scaleFactor = 1.0;

        const splash4Width = 130.4 * scaleFactor;
        const splash4Height = 54.65 * scaleFactor;
        const splash4X = Math.min(
            sideLookRightEdge - splash4Width * 0.6,
            this.canvas.width - splash4Width
        );
        const splash4Y = boatBottomY - splash4Height * 0.01;
        const splash4 = new Splash(
            splash4X,
            splash4Y,
            splash4Width,
            splash4Height,
            3
        );
        await splash4.loadAnimations(this.splashJsonPath, "_4");
        this.splashes.push(splash4);

        const splash3Width = 149.7 * scaleFactor;
        const splash3Height = 100.35 * scaleFactor;
        const splash3X = Math.min(
            splash4X + splash4Width * 0.4,
            this.canvas.width - splash3Width
        );
        const splash3Y = boatBottomY - splash3Height * 0.1;
        const splash3 = new Splash(
            splash3X,
            splash3Y,
            splash3Width,
            splash3Height,
            3
        );
        await splash3.loadAnimations(this.splashJsonPath, "_3");
        this.splashes.push(splash3);
    }

    async createCaptain() {
        try {
            const captainWidth = 200;
            const captainHeight = 260;
            const captainX = 0;
            const captainY = 0;

            this.captain = new Captain(
                captainX,
                captainY,
                captainWidth,
                captainHeight,
                3
            );

            const animationPromise = this.captain.loadAnimations(
                this.captainJsonPath
            );

            const timeoutPromise = new Promise((resolve) => {
                setTimeout(resolve, 5000);
            });

            await Promise.race([animationPromise, timeoutPromise]);
        } catch (error) {
            console.error("Error creating captain:", error);
        }
    }

    adjustCaptainPosition() {
        if (!this.captain || !this.boat) return;

        // Position the captain at the right side of the boat
        const sideLookSettings = this.boat.variantSettings.side_look;
        const sideLookWidth = this.boat.width * sideLookSettings.scaleX;
        const sideLookX =
            this.boat.x + this.boat.width * sideLookSettings.offsetX;

        // Position the captain at the end of the boat
        this.captain.x =
            sideLookX + sideLookWidth * 0.14 - this.captain.width / 2;
        this.captain.y =
            this.boat.y + this.boat.height * 0.53 - this.captain.height / 2;
    }

    async createClouds() {
        const canvasWidth = this.canvas.width;

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
                y: 105,
                width: 275,
                height: 80,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: 450,
                y: 95,
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
                x: 850,
                y: 90,
                width: 300,
                height: 90,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 100,
                y: 80,
                width: 300,
                height: 90,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 350,
                y: 110,
                width: 300,
                height: 90,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 600,
                y: 95,
                width: 300,
                height: 90,
                depth: 0.6,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 850,
                y: 105,
                width: 300,
                height: 90,
                depth: 0.6,
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
                y: 5,
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
            {
                x: 900,
                y: 10,
                width: 400,
                height: 95,
                depth: 1.2,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 200,
                y: 5,
                width: 400,
                height: 95,
                depth: 1.2,
                frameDelay: 20,
            },
            {
                x: canvasWidth + 500,
                y: 0,
                width: 375,
                height: 90,
                depth: 1.2,
                frameDelay: 25,
            },
            {
                x: canvasWidth + 800,
                y: 10,
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
            const response = await fetch("assets/lost_at_sea/background.json");
            if (!response.ok) {
                throw new Error("Failed to load background data");
            }

            const backgroundData = await response.json();

            if (backgroundData.background_image) {
                this.backgroundImage = new Image();
                this.backgroundImage.src = backgroundData.background_image;
            }
        } catch (error) {
            // Error handling
        }
    }

    createPlayer(characterType = "rogue") {
        let player;

        switch (characterType.toLowerCase()) {
            case "paladin":
                player = new Paladin(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;

            case "rogue":
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;

            case "mage":
                player = new Mage(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;

            default:
                player = new Rogue(0, 0);
                player.x = (this.canvas.width - player.width) / 2;
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;
        }

        this.adjustPlayerPosition();
    }

    adjustPlayerPosition() {
        if (!this.player || !this.boat) return;

        const playerSettings = this.boat.variantSettings.player_ground;
        const playerBoatWidth = this.boat.width * playerSettings.scaleX;
        const playerGroundX =
            this.boat.x + this.boat.width * playerSettings.offsetX;

        this.player.x =
            playerGroundX + (playerBoatWidth - this.player.width) / 2;

        this.player.y =
            this.boat.y - this.player.height + this.boat.height * 0.8;

        if (!this.playerBoundaries.set) {
            const leftMargin = playerBoatWidth * 0.15;
            const rightMargin = playerBoatWidth * -0.02;
            const minX = playerGroundX + leftMargin;
            const maxX = playerGroundX + playerBoatWidth - rightMargin;

            this.playerBoundaries.minX = minX;
            this.playerBoundaries.maxX = maxX;
            this.playerBoundaries.set = true;

            if (this.player.setMovementBoundaries) {
                this.player.setMovementBoundaries(minX, maxX);
            }
        }
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;

        if (e.key === "r" || e.key === "R") {
            for (const splash of this.splashes) {
                splash.reset();
            }
        }

        if (e.key === "b" || e.key === "B") {
            if (this.boat) {
                const newVariant =
                    this.boat.currentVariant === "side_look"
                        ? "player_ground"
                        : "side_look";

                if (!this.boat.loaded[newVariant]) {
                    if (
                        newVariant === "player_ground" &&
                        !this.boat.sprites.player_ground
                    ) {
                        this.boat.sprites.player_ground = new Image();
                        this.boat.sprites.player_ground.src =
                            "./assets/lost_at_sea/boat/boat_player_ground.svg";
                        this.boat.sprites.player_ground.onload = () => {
                            this.boat.loaded.player_ground = true;
                            this.boat.setVariant("player_ground");
                            this.adjustPlayerPosition();
                        };
                    }
                }

                if (this.boat.setVariant(newVariant)) {
                    if (newVariant === "side_look") {
                        this.boat.y = this.boat.originalY;
                        this.boat.velocityY = 0;
                    } else {
                        this.boat.velocityY = 0;
                    }

                    if (this.player) {
                        this.adjustPlayerPosition();
                    }
                }
            }
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    initMovementSound() {
        this.movementSound = document.getElementById("movementSound");
        if (this.movementSound) {
            this.movementSound.volume = 0.7;
        }
    }

    playMovementSound() {
        if (this.movementSound && !this.movementSoundPlaying) {
            this.movementSound
                .play()
                .then(() => {
                    this.movementSoundPlaying = true;
                })
                .catch((error) => {
                    console.error("Error playing movement sound:", error);
                });
        }
    }

    stopMovementSound() {
        if (this.movementSound && this.movementSoundPlaying) {
            this.movementSound.pause();
            this.movementSoundPlaying = false;
        }
    }

    processInput() {
        const wasMoving = this.isPlayerMoving;
        this.isPlayerMoving = false;

        if (this.player) {
            if (this.keys["ArrowLeft"] || this.keys["a"]) {
                this.player.moveLeft();
                this.isPlayerMoving = true;
            } else if (this.keys["ArrowRight"] || this.keys["d"]) {
                this.player.moveRight();
                this.isPlayerMoving = true;
            } else {
                this.player.stopX();
            }

            if (this.keys["ArrowUp"] || this.keys["w"]) {
                this.player.moveUp();
                this.isPlayerMoving = true;
            } else if (this.keys["ArrowDown"] || this.keys["s"]) {
                this.player.moveDown();
                this.isPlayerMoving = true;
            } else {
                this.player.stopY();
            }

            if (this.isPlayerMoving && !wasMoving) {
                this.playMovementSound();
            } else if (!this.isPlayerMoving && wasMoving) {
                this.stopMovementSound();
            }
        }
    }

    update() {
        if (this.boat) {
            this.boat.update();
        }

        if (this.player) {
            if (this.boat && !this.playerBoundaries.set) {
                this.adjustPlayerPosition();
            } else {
                if (this.boat && this.boat.isFloating) {
                    this.player.y =
                        this.boat.y -
                        this.player.height +
                        this.boat.height * 0.82;
                }
            }

            this.player.update();
        }

        try {
            if (this.captain) {
                this.captain.update();
                if (this.boat) {
                    this.adjustCaptainPosition();
                }
            }
        } catch (error) {
            console.error("Error updating captain:", error);
        }

        for (const cloud of this.clouds) {
            cloud.update(this.canvas.width);
        }

        for (const wave of this.backWaves) {
            wave.update(this.canvas.width);
        }

        for (const wave of this.frontWaves) {
            wave.update(this.canvas.width);
        }

        for (const splash of this.splashes) {
            splash.update();
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

        if (this.boat && this.boat.loaded.player_ground) {
            this.boat.renderPlayerGround(this.ctx);
        }

        if (this.player) {
            this.player.render(this.ctx);
        }

        try {
            if (this.captain) {
                this.ctx.save();
                this.adjustCaptainPosition();
                this.captain.render(this.ctx);
                this.ctx.restore();
            }
        } catch (error) {
            console.error("Error rendering captain:", error);
        }

        if (this.boat && this.boat.loaded.side_look) {
            this.boat.renderSideLook(this.ctx);
        }

        for (const splash of this.splashes) {
            splash.render(this.ctx);
        }

        for (const wave of this.frontWaves) {
            wave.render(this.ctx);
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
