import Mage from "./Mage.js";
import Paladin from "./Paladin.js";
import Rogue from "./Rogue.js";
import Cloud from "./Cloud.js";
import Boat from "./Boat.js";
import Wave from "./Wave.js";
import Splash from "./Splash.js";

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
    }

    async init() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));

        this.loadBackgroundImage();
        this.createClouds();
        this.createWaves();

        // Create boat first, then splashes (since splashes need boat position)
        await this.createBoat();
        await this.createSplash();

        // Debug: Check boat variants after a short delay to ensure they're loaded
        setTimeout(() => {
            if (this.boat) {
                console.log("Boat variants loaded status:", this.boat.loaded);
                console.log("Current boat variant:", this.boat.currentVariant);
                console.log(
                    "Available boat sprites:",
                    Object.keys(this.boat.sprites)
                );

                // Log the actual image paths to verify they're correct
                console.log(
                    "player_ground image path:",
                    this.boat.sprites.player_ground?.src
                );
                console.log(
                    "side_look image path:",
                    this.boat.sprites.side_look?.src
                );

                // Force load both variants if they're not loaded yet
                if (!this.boat.loaded.player_ground) {
                    console.log("Force loading player_ground variant...");
                    this.boat.sprites.player_ground = new Image();
                    this.boat.sprites.player_ground.src =
                        "./assets/lost_at_sea/boat/boat_player_ground.svg";
                    this.boat.sprites.player_ground.onload = () => {
                        console.log(
                            "Player ground boat image loaded successfully"
                        );
                        this.boat.loaded.player_ground = true;
                    };
                }

                if (!this.boat.loaded.side_look) {
                    console.log("Force loading side_look variant...");
                    this.boat.sprites.side_look = new Image();
                    this.boat.sprites.side_look.src =
                        "./assets/lost_at_sea/boat/boat_side_look.svg";
                    this.boat.sprites.side_look.onload = () => {
                        console.log("Side look boat image loaded successfully");
                        this.boat.loaded.side_look = true;
                    };
                }

                // Make sure we start with side_look variant visible on top
                this.boat.setVariant("side_look");

                // Adjust player position if present
                if (this.player) {
                    this.adjustPlayerPosition();
                }
            }
        }, 1000);
    }

    async createWaves() {
        const waveHeight = 90;
        const waveWidth = 416;
        // Add more waves to ensure full coverage with the wider boat
        const numWavesNeeded =
            Math.ceil(this.canvas.width / (waveWidth - 20)) + 2;

        // Back waves (behind the boat)
        for (let i = 0; i < numWavesNeeded; i++) {
            const x = i * (waveWidth - 10);
            // Position waves higher to be visible with the larger boat
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

        // Front waves (in front of the boat)
        for (let i = 0; i < numWavesNeeded; i++) {
            const x = i * (waveWidth - 20);
            // Position front waves higher to be visible with the larger boat
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
        // Set boat width to a reasonable size (half the canvas width)
        // This prevents stretching while still making it large enough
        const boatWidth = this.canvas.width * 0.8;

        // Calculate height based on aspect ratio to maintain proportions
        const boatHeight = this.canvas.height * 0.7;

        // Position boat at the center of the canvas
        const boatX = (this.canvas.width - boatWidth) / 2;

        // Position boat at the bottom of the screen, but leave some space for waves
        const boatY = this.canvas.height - boatHeight * 0.9;

        this.boat = new Boat(boatX, boatY, boatWidth, boatHeight);
        await this.boat.loadImage(this.boatJsonPath);

        console.log(
            "Boat created at position:",
            boatX,
            boatY,
            "with dimensions:",
            boatWidth,
            "x",
            boatHeight
        );
    }

    async createSplash() {
        if (!this.boat) {
            console.error(
                "Boat not initialized yet. Cannot position splashes."
            );
            return;
        }

        // Get boat position and dimensions
        const boatX = this.boat.x;
        const boatY = this.boat.y;
        const boatWidth = this.boat.width;
        const boatHeight = this.boat.height;

        // Calculate the position of the side_look boat (right side)
        const sideLookSettings = this.boat.variantSettings.side_look;
        const sideLookWidth = boatWidth * sideLookSettings.scaleX;
        const sideLookX = boatX + boatWidth * sideLookSettings.offsetX;
        const sideLookRightEdge = sideLookX + sideLookWidth;
        const boatBottomY = boatY + boatHeight * 0.8;

        // Scale factors to make splashes appropriate size relative to boat
        const scaleFactor = 1.0; // Adjusted scale factor

        // Create splash type _4 (smallest splash at the front of the boat)
        const splash4Width = 130.4 * scaleFactor;
        const splash4Height = 54.65 * scaleFactor;
        // Position splash at the right edge of the side_look boat, but ensure it's visible
        const splash4X = Math.min(
            sideLookRightEdge - splash4Width * 0.6,
            this.canvas.width - splash4Width
        );
        const splash4Y = boatBottomY - splash4Height * 0.01; // Position at bottom of boat
        const splash4 = new Splash(
            splash4X,
            splash4Y,
            splash4Width,
            splash4Height,
            3 // Slow animation
        );
        await splash4.loadAnimations(this.splashJsonPath, "_4");
        this.splashes.push(splash4);

        // // Create splash type _2 (medium splash slightly further from boat)
        // const splash2Width = 160.1 * scaleFactor;
        // const splash2Height = 98.3 * scaleFactor;
        // // Position splash right after the first splash, ensuring it's visible
        // const splash2X = Math.min(
        //     sideLookRightEdge + splash4Width * 0.2,
        //     this.canvas.width - splash2Width
        // );
        // const splash2Y = boatBottomY - splash2Height * 0.1;
        // const splash2 = new Splash(
        //     splash2X,
        //     splash2Y,
        //     splash2Width,
        //     splash2Height,
        //     4 // Slow animation
        // );
        // await splash2.loadAnimations(this.splashJsonPath, "_2");
        // this.splashes.push(splash2);

        // Create splash type _3 (another medium splash further out)
        const splash3Width = 149.7 * scaleFactor;
        const splash3Height = 100.35 * scaleFactor;
        // Position splash even further to the right, ensuring it's visible
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
            3 // Slow animation
        );
        await splash3.loadAnimations(this.splashJsonPath, "_3");
        this.splashes.push(splash3);

        // Create splash type _1 (tallest splash furthest from boat)
        // const splash1Width = 102.8 * scaleFactor;
        // const splash1Height = 146.1 * scaleFactor;
        // // Position splash at the far right, ensuring it's visible
        // const splash1X = Math.min(
        //     splash3X + splash3Width * 0.4,
        //     this.canvas.width - splash1Width
        // );
        // const splash1Y = boatBottomY - splash1Height * 0.1;
        // const splash1 = new Splash(
        //     splash1X,
        //     splash1Y,
        //     splash1Width,
        //     splash1Height,
        //     4 // Slow animation
        // );
        // await splash1.loadAnimations(this.splashJsonPath, "_1");
        // this.splashes.push(splash1);

        console.log("Splash positions:", {
            boatX,
            boatY,
            boatWidth,
            boatHeight,
            sideLookX,
            sideLookRightEdge,
            splash4X,
            splash4Y,
            splash2X,
            splash2Y,
            splash3X,
            splash3Y,
            splash1X,
            splash1Y,
        });
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
                player.y = this.canvas.height - player.height - 50;
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
                player.y = this.canvas.height - player.height - 50;
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
                player.y = this.canvas.height - player.height - 50;
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

        // Adjust player position based on current boat variant
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

        console.log("Adjusted player position:", {
            x: this.player.x,
            y: this.player.y,
            boatX: this.boat.x,
            boatY: this.boat.y,
            playerGroundX: playerGroundX,
            playerHeight: this.player.height,
            boatHeight: this.boat.height,
        });
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;

        // Reset splash animations when 'R' key is pressed
        if (e.key === "r" || e.key === "R") {
            for (const splash of this.splashes) {
                splash.reset();
            }
        }

        // Switch boat variants when 'B' key is pressed
        if (e.key === "b" || e.key === "B") {
            if (this.boat) {
                // Toggle between side_look and player_ground
                const newVariant =
                    this.boat.currentVariant === "side_look"
                        ? "player_ground"
                        : "side_look";

                console.log("Attempting to switch to variant:", newVariant);
                console.log("Current loaded status:", this.boat.loaded);

                // Force load the variant if not loaded yet
                if (!this.boat.loaded[newVariant]) {
                    console.log(
                        `Variant ${newVariant} not loaded yet, forcing load...`
                    );

                    // Create and load the image directly
                    if (
                        newVariant === "player_ground" &&
                        !this.boat.sprites.player_ground
                    ) {
                        this.boat.sprites.player_ground = new Image();
                        this.boat.sprites.player_ground.src =
                            "./assets/lost_at_sea/boat/boat_player_ground.svg";
                        this.boat.sprites.player_ground.onload = () => {
                            console.log(
                                "Player ground boat image loaded successfully"
                            );
                            this.boat.loaded.player_ground = true;
                            this.boat.setVariant("player_ground");
                            this.adjustPlayerPosition();
                        };
                    }
                }

                if (this.boat.setVariant(newVariant)) {
                    console.log(`Switched to boat variant: ${newVariant}`);

                    // Reset boat physics when switching variants
                    if (newVariant === "side_look") {
                        // Reset to original floating position
                        this.boat.y = this.boat.originalY;
                        this.boat.velocityY = 0;
                    } else {
                        // Start falling from current position
                        this.boat.velocityY = 0;
                    }

                    // Adjust player position if present
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
        // Update boat first since player position depends on it
        if (this.boat) {
            this.boat.update();
        }

        if (this.player) {
            // Adjust player position to follow the boat
            if (this.boat) {
                this.adjustPlayerPosition();
            }

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

        if (this.boat) {
            this.boat.render(this.ctx);
        }

        // Render splashes right after the boat
        for (const splash of this.splashes) {
            splash.render(this.ctx);
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
