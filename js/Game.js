import Mage from "./Mage.js";
import Paladin from "./Paladin.js";
import Rogue from "./Rogue.js";
import Cloud from "./Cloud.js";
import Boat from "./Boat.js";
import Wave from "./Wave.js";
import Splash from "./Splash.js";
import Captain from "./Captain.js";
import Projectile from "./Projectile.js";
import Goblin from "./Goblin.js";

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
        this.goblinJsonPath = "assets/enemy/animation_goblin.json";

        // Goblin enemies
        this.goblins = [];
        this.currentWave = 1;
        this.maxWaves = 1; // Sadece bir dalga
        this.wavesCleared = 0;
        this.isWaveInProgress = false;

        this.isPlayerMoving = false;
        this.movementSoundPlaying = false;

        // Add mouse state tracking
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.attackCooldown = 0;
        this.attackCooldownMax = 20; // Frames between attacks when holding mouse

        // Projectile management
        this.projectiles = [];

        this.playerBoundaries = {
            minX: 0,
            maxX: 0,
            set: false,
        };

        // Player hurt cooldown
        this.playerHurtCooldown = 0;
        this.playerHurtCooldownMax = 240; // 4 seconds at 60 FPS

        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.isDead = false;
        this.consecutiveHits = 0; // Ardışık vuruş sayacı

        // Yeniden başlatma butonu
        this.reviveButton = document.createElement("button");
        this.reviveButton.textContent = "Tekrar Oyna";
        this.reviveButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 30px;
            font-size: 18px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: none;
            z-index: 1000;
        `;
        this.reviveButton.addEventListener("click", () => this.restartGame());
        document.body.appendChild(this.reviveButton);

        this.meleeImpactPlayedThisAttack = false;
    }

    restartGame() {
        this.playerHealth = this.playerMaxHealth;
        this.isDead = false;
        this.reviveButton.style.display = "none";
        this.gameRunning = true;
        this.consecutiveHits = 0;

        // Oyuncuyu başlangıç pozisyonuna getir
        if (this.player) {
            this.player.x = this.canvas.width * 0.2;
            this.player.y = this.canvas.height - this.player.height - 50;
        }
    }

    async init() {
        const loaderContainer = document.getElementById("loaderContainer");
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Tüm yükleme işlemleri tamamlandıktan sonra yükleme ekranını kaldır
        window.addEventListener("load", () => {
            setTimeout(() => {
                loaderContainer.classList.add("loader-hidden");
                setTimeout(() => {
                    loaderContainer.style.display = "none";
                }, 500);
            }, 1000);
        });

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));
        this.canvas.addEventListener(
            "mousedown",
            this.handleMouseDown.bind(this)
        );
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener(
            "mouseleave",
            this.handleMouseUp.bind(this)
        );
        this.canvas.addEventListener(
            "mousemove",
            this.handleMouseMove.bind(this)
        );

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

    async createGoblins() {
        try {
            // Wait for player to be created first
            if (!this.player) {
                console.warn("Player not created yet, cannot position goblins");
                return;
            }

            // Use player movement boundaries for goblin placement
            const minX = this.playerBoundaries.minX;
            const maxX = this.playerBoundaries.maxX;
            const goblinWidth = 160;
            const goblinHeight = 160;
            const groundY =
                this.player.y + this.player.height - goblinHeight - 30; // 30px higher

            // Place 3 goblins at random X positions within boundaries
            const goblinCount = 3;
            for (let i = 0; i < goblinCount; i++) {
                // Ensure goblin stays within boundaries
                const x = Math.random() * (maxX - minX - goblinWidth) + minX;
                const goblin = new Goblin(
                    x,
                    groundY,
                    goblinWidth,
                    goblinHeight
                );
                await goblin.loadAnimations(
                    "assets/enemy/animation_goblin.json"
                );
                this.goblins.push(goblin);
            }

            this.goblins.length;
        } catch (error) {
            console.error("Error creating goblins:", error);
        }
    }

    spawnGoblinsForWave() {
        const goblinsPerWave = 3; // Sabit 3 goblin
        const spacing = 150; // Goblinler arası mesafe artırıldı

        // Goblinkeri senkron olarak oluştur
        const spawnGoblins = async () => {
            // Tekneyi referans al
            let spawnY;
            if (this.boat) {
                spawnY = this.boat.y + this.boat.height * 0.3;
            } else {
                spawnY = this.canvas.height * 0.65;
            }

            // Goblinkeri ekranın sağ yarısına dengeli dağıt
            const startX = this.canvas.width * 0.6; // Ekranın %60'ından başla
            for (let i = 0; i < goblinsPerWave; i++) {
                const x = startX + i * spacing;
                const goblin = new Goblin(x, spawnY);
                await goblin.loadAnimations(this.goblinJsonPath);
                this.goblins.push(goblin);
            }
            this.isWaveInProgress = true;
        };

        spawnGoblins();
    }

    checkWaveCompletion() {
        // Only check if wave is in progress and all goblins are dead (not just removed)
        if (
            !this.isWaveInProgress ||
            this.goblins.some((goblin) => !goblin.isDead)
        ) {
            return;
        }

        // Make sure all goblins are fully removed before proceeding
        if (this.goblins.length > 0) {
            return;
        }

        // Wave completed, prepare for next wave
        this.wavesCleared++;
        this.isWaveInProgress = false;

        if (this.currentWave < this.maxWaves) {
            const delayBetweenWaves = 6000; // 6 seconds between waves
            this.currentWave++;
            setTimeout(() => {
                if (!this.isWaveInProgress) {
                    // Double check to prevent double spawning
                    this.spawnGoblinsForWave();
                }
            }, delayBetweenWaves);
        } else {
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

    createPlayer(characterType = "paladin") {
        let player;

        switch (characterType.toLowerCase()) {
            case "paladin":
                player = new Paladin(0, 0);
                player.x = this.canvas.width * 0.2; // Ekranın sol tarafına yerleştir
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;

            case "rogue":
                player = new Rogue(0, 0);
                player.x = this.canvas.width * 0.2; // Ekranın sol tarafına yerleştir
                player.y = this.canvas.height - player.height - 50;
                this.player = player;
                break;

            case "mage":
                player = new Mage(0, 0);
                player.x = this.canvas.width * 0.2; // Ekranın sol tarafına yerleştir
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

        // Set up callbacks for player animations
        this.player.setCallbacks({
            onJumpLand: (isRunning) => {
                // If the player is running when landing, play the movement sound
                if (isRunning) {
                    this.playMovementSound();
                }
            },
        });

        // Set the cursor based on character type
        this.updateCursorForCharacter();

        this.adjustPlayerPosition();
    }

    // Update cursor for all characters to use the custom cursor
    updateCursorForCharacter() {
        const gameCanvas = document.getElementById("gameCanvas");

        // Use the custom cursor for all character types
        gameCanvas.style.cursor = "var(--cursor-custom)";
    }

    // (Removed misplaced goblin update for-loop from class body. Goblin update logic should be inside the update() method, which already exists below.)

    adjustPlayerPosition() {
        if (!this.player || !this.boat) return;

        const playerSettings = this.boat.variantSettings.player_ground;
        const playerBoatWidth = this.boat.width * playerSettings.scaleX;
        const playerGroundX =
            this.boat.x + this.boat.width * playerSettings.offsetX;

        // Set X position
        this.player.x =
            playerGroundX + (playerBoatWidth - this.player.width) / 2;

        // Only adjust Y position if not jumping
        if (!this.player.isJumping) {
            // Get character type to set specific Y position
            const characterType = this.player.constructor.name;
            let yOffset = 0.8; // Default offset

            // Set specific Y offsets for each character class
            if (characterType === "Mage") {
                yOffset = 0.85; // Raise the mage a bit higher on the boat
            } else if (characterType === "Rogue") {
                yOffset = 0.82; // Slightly adjust rogue position
            } else if (characterType === "Paladin") {
                yOffset = 0.8; // Keep paladin at the original position
            }

            this.player.y =
                this.boat.y - this.player.height + this.boat.height * yOffset;

            // Also update the initialY value so jumps start from the right position
            this.player.initialY = this.player.y;
        }

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
        // Initialize display flags
        window.showHitboxes = false;
        window.showAimDebug = false;

        // Add keyboard shortcuts for testing features
        document.addEventListener("keydown", (e) => {
            // Press 'h' to toggle hitbox display
            if (e.key === "h") {
                this.toggleHitboxes();
                this.toggleAimVisualization();
            }
            if (e.key == "g") {
                this.toggleGoblinDebug();
            }
        });

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Toggle hitbox display
    toggleHitboxes() {
        window.showHitboxes = !window.showHitboxes;
    }

    // Toggle aim visualization
    toggleAimVisualization() {
        window.showAimDebug = !window.showAimDebug;
    }

    // Toggle goblin debug
    toggleGoblinDebug() {
        window.showHitboxes = !window.showHitboxes;
    }

    // Create a projectile for ranged attacks
    createProjectile(angle, attackType) {
        if (!this.player) return;

        // Calculate the base center position of the character
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;

        // Determine aim type based on angle (same logic as in Player.performRangedAttack)
        const angleDegrees = angle * (180 / Math.PI);
        let aimType = "default";

        // Determine aim type using the same angle ranges as in Player class
        if (angleDegrees > -110 && angleDegrees < -70) {
            aimType = "up_90"; // Shooting straight up
        } else if (angleDegrees > 70 && angleDegrees < 110) {
            aimType = "down_90"; // Shooting straight down
        } else if (angleDegrees >= -70 && angleDegrees < -20) {
            aimType = "up_45"; // Shooting up at 45 degrees
        } else if (angleDegrees >= -20 && angleDegrees <= 20) {
            aimType = "default"; // Shooting straight left/right
        } else if (angleDegrees > 20 && angleDegrees <= 70) {
            aimType = "down_45"; // Shooting down at 45 degrees
        } else if (angleDegrees > 110 && angleDegrees <= 160) {
            aimType = "down_45"; // Shooting down at 45 degrees (other side)
        } else if (angleDegrees > 160 || angleDegrees <= -110) {
            aimType = "default"; // Shooting straight left/right (other side)
        }

        // Start with fire socket at center of character
        let fireSocketX = centerX;
        let fireSocketY = centerY;

        // Get character type to adjust offsets appropriately
        const characterType = this.player.constructor.name.toLowerCase();

        // Character-specific offsets (can be adjusted based on animation)
        let heightOffsetRatio = 0.2; // Default 20% of height
        let widthOffsetRatio = 0.25; // Default 25% of width

        // Adjust offsets based on character type
        if (characterType === "mage") {
            heightOffsetRatio = 0.22;
            widthOffsetRatio = 0.28;
        } else if (characterType === "paladin") {
            heightOffsetRatio = 0.18;
            widthOffsetRatio = 0.22;
        } else if (characterType === "rogue") {
            heightOffsetRatio = 0.2;
            widthOffsetRatio = 0.25;
        }

        const heightOffset = this.player.height * heightOffsetRatio;
        const widthOffset = this.player.width * widthOffsetRatio;

        // Direction-based offset
        const directionMultiplier = this.player.direction === "right" ? 1 : -1;

        // Adjust position based on character type and aim type
        if (characterType === "paladin") {
            // Paladin-specific positions
            switch (aimType) {
                case "up_90":
                    // When shooting straight up, position socket at top of character
                    fireSocketY = centerY - heightOffset * -0.1;
                    break;
                case "up_45":
                    // When shooting at 45° up, position socket at top-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY - heightOffset * -0.5;
                    break;
                case "default":
                    // When shooting straight, position socket at side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY - heightOffset * -0.8;
                    break;
                case "down_45":
                    // When shooting at 45° down, position socket at bottom-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * -0.1;
                    fireSocketY = centerY + heightOffset * 1.4;
                    break;
                case "down_90":
                    // When shooting straight down, position socket at bottom of character
                    fireSocketY = centerY + heightOffset * 1.9;
                    break;
            }
        } else if (characterType === "mage") {
            // Mage-specific positions
            switch (aimType) {
                case "up_90":
                    // When shooting straight up, position socket at top of character
                    fireSocketY = centerY - heightOffset * 1.2;
                    break;
                case "up_45":
                    // When shooting at 45° up, position socket at top-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.9;
                    fireSocketY = centerY - heightOffset * 0.8;
                    break;
                case "default":
                    // When shooting straight, position socket at side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.1;
                    fireSocketY = centerY - heightOffset * 0.2;
                    break;
                case "down_45":
                    // When shooting at 45° down, position socket at bottom-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.7;
                    fireSocketY = centerY + heightOffset * 0.8;
                    break;
                case "down_90":
                    // When shooting straight down, position socket at bottom of character
                    fireSocketY = centerY + heightOffset * 1.5;
                    break;
            }
        } else {
            // Rogue-specific positions
            switch (aimType) {
                case "up_90":
                    // When shooting straight up, position socket at top of character
                    fireSocketY = centerY - heightOffset * 1.0;
                    break;
                case "up_45":
                    // When shooting at 45° up, position socket at top-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.0;
                    fireSocketY = centerY - heightOffset * 0.6;
                    break;
                case "default":
                    // When shooting straight, position socket at side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 1.2;
                    fireSocketY = centerY;
                    break;
                case "down_45":
                    // When shooting at 45° down, position socket at bottom-side of character
                    fireSocketX =
                        centerX + widthOffset * directionMultiplier * 0.8;
                    fireSocketY = centerY + heightOffset * 0.6;
                    break;
                case "down_90":
                    // When shooting straight down, position socket at bottom of character
                    fireSocketY = centerY + heightOffset * 1.2;
                    break;
            }
        }

        // Determine projectile size based on character type
        let projectileWidth, projectileHeight, projectileSpeed;

        if (characterType === "mage") {
            projectileWidth = 30; // Original: 60
            projectileHeight = 30; // Original: 60
            projectileSpeed = 7;
        } else if (characterType === "paladin") {
            projectileWidth = 30; // Original: 40
            projectileHeight = 70; // Original: 100
            projectileSpeed = 5;
        } else {
            // rogue
            projectileWidth = 15; // Original: 30
            projectileHeight = 15; // Original: 30
            projectileSpeed = 12;
        }

        // Create the projectile
        const projectile = new Projectile(
            fireSocketX,
            fireSocketY,
            projectileWidth,
            projectileHeight,
            projectileSpeed,
            angle,
            characterType,
            attackType
        );

        // Add to projectiles array
        this.projectiles.push(projectile);
    }

    // Toggle cursor visibility (for testing)
    toggleCursor() {
        const gameCanvas = document.getElementById("gameCanvas");
        if (gameCanvas.style.cursor === "var(--cursor-custom)") {
            gameCanvas.style.cursor = "default";
        } else {
            gameCanvas.style.cursor = "var(--cursor-custom)";
        }
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;

        // Check for skill key presses
        if (e.key === "1" && this.player) {
            // Check if the player is a Paladin
            if (this.player.constructor.name === "Paladin") {
                // Try to use the smite skill
                const smiteUsed = this.player.useSmite();

                if (smiteUsed) {
                    // Play smite sounds
                    this.playSmiteSound();
                }
            }
        }

        // 'R' key to respawn goblins
        if (e.key.toLowerCase() === "r") {
            // Reset any existing goblins
            this.goblins = [];
            // Spawn new goblins
            this.spawnGoblinsForWave();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    // Method to play smite sounds
    playSmiteSound() {
        // Play both skill and voice sounds simultaneously
        const skillSound = new Audio("assets/audio/paladin_skills_smite.wav");
        const voiceSound = new Audio("assets/audio/paladin_vox_smite.wav");

        // Set volume
        skillSound.volume = 0.7;
        voiceSound.volume = 0.7;

        // Play sounds
        skillSound.play().catch(() => {
            // Silently handle error
        });

        voiceSound.play().catch(() => {
            // Silently handle error
        });
    }

    playPlayerHurtSound() {
        const hurtSoundNumber = Math.floor(Math.random() * 3) + 1; // Random number between 1-3
        const hurtSound = new Audio(
            `assets/audio/paladin_hurt_0${hurtSoundNumber}.wav`
        );
        hurtSound.volume = 0.7;
        hurtSound.play().catch(() => {
            // Silently handle error
        });
    }

    playMeleeImpactSound() {
        const currentTime = Date.now();
        // Set a longer cooldown to prevent sound overlap
        if (
            !this.lastImpactSoundTime ||
            currentTime - this.lastImpactSoundTime >= 200
        ) {
            const impactNumber = Math.floor(Math.random() * 3) + 1;
            const impactSound = new Audio(
                `assets/audio/melee_impact_0${impactNumber}.wav`
            );
            impactSound.volume = 0.7;
            impactSound.play().catch(() => {
                // Silently handle error
            });
            this.lastImpactSoundTime = currentTime;
        }
    }

    handleMouseMove(e) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    handleMouseDown(e) {
        // Only handle left mouse button (button 0)
        if (e.button === 0 && this.player) {
            this.isMouseDown = true;

            // Get mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Trigger attack immediately
            if (this.player.attack) {
                if (this.player.skillCooldown <= 0) {
                    const attackResult = this.player.attack(mouseX, mouseY);

                    if (attackResult.success) {
                        // Play attack sound
                        this.playAttackSound(attackResult.isRanged);
                        this.player.skillCooldown = 300; // 5 saniye (60fps * 5)

                        // Create projectile for ranged attacks
                        if (attackResult.isRanged) {
                            this.createProjectile(
                                attackResult.angle,
                                attackResult.attackType
                            );
                        }
                    }
                }
            }
        }
    }

    handleMouseUp(e) {
        // Only handle left mouse button (button 0) or any button for mouseleave
        if ((e.button === 0 || e.type === "mouseleave") && this.isMouseDown) {
            // Reset mouse down flag
            this.isMouseDown = false;
        }
    }

    playAttackSound(isRanged = false) {
        // Get the current attack type from the player
        const attackType = this.player.currentAttackType;
        let soundFile;

        // Get the character type
        const characterType = this.player.constructor.name.toLowerCase();
        const prefix = characterType;

        // For ranged attacks, always use _01 since that's all we have
        if (isRanged) {
            soundFile = `assets/audio/${prefix}_ranged_01.wav`;
        } else {
            // For melee attacks, use the proper sequence
            switch (attackType) {
                case "first":
                    soundFile = `assets/audio/${prefix}_melee_01.wav`;
                    break;
                case "second":
                    soundFile = `assets/audio/${prefix}_melee_02.wav`;
                    break;
                case "third":
                    soundFile = `assets/audio/${prefix}_melee_03.wav`;
                    break;
                default:
                    soundFile = `assets/audio/${prefix}_melee_01.wav`;
            }
        }

        // Create and play the sound
        const sound = new Audio(soundFile);
        sound.volume = 0.7;

        sound.play().catch(() => {
            /* Silently handle error */
        });
    }

    initMovementSound() {
        this.movementSound = document.getElementById("movementSound");
        if (this.movementSound) {
            this.movementSound.volume = 0.7;
        }

        // We're using direct Audio objects for jump sound now
        // No need to initialize from DOM
    }

    playMovementSound() {
        if (this.movementSound && !this.movementSoundPlaying) {
            this.movementSound
                .play()
                .then(() => {
                    this.movementSoundPlaying = true;
                })
                .catch(() => {
                    // Silently handle error
                });
        }
    }

    stopMovementSound() {
        if (this.movementSound && this.movementSoundPlaying) {
            this.movementSound.pause();
            this.movementSoundPlaying = false;
        }
    }

    playJumpSound() {
        // Create a brand new Audio object each time
        const sound = new Audio("assets/audio/sound_jump.wav");
        sound.volume = 0.7;

        // Play it immediately
        sound.play().catch(() => {
            // Silently handle error
        });
    }

    processInput() {
        const wasMoving = this.isPlayerMoving;
        this.isPlayerMoving = false;

        // Debug cooldown status for Paladin
        if (this.player && this.player.constructor.name === "Paladin") {
            // Check if the player is a Paladin and has the smiteCooldown property
            if (this.player.smiteCooldown !== undefined) {
                // If cooldown is active, log it
                if (this.player.smiteCooldown > 0) {
                    // Cooldown is active
                    this.player.isUsingSmite = true;
                } else {
                    // Cooldown is not active
                    this.player.isUsingSmite = false;
                }
            }
        }

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

            // Handle jump with w key or spacebar or arrow up
            if (this.keys["w"] || this.keys["ArrowUp"] || this.keys[" "]) {
                if (!this.player.isJumping) {
                    // Jump key pressed
                    this.player.jump();
                    this.isPlayerMoving = true;

                    // Play jump sound
                    this.playJumpSound();

                    // Stop movement sound when jumping
                    this.stopMovementSound();
                }
            }

            // Only stop Y movement if not jumping
            else if (!this.player.isJumping) {
                this.player.stopY();
            }

            // Only play movement sound if player is moving horizontally AND not jumping
            if (this.isPlayerMoving && !wasMoving && !this.player.isJumping) {
                this.playMovementSound();
            } else if (
                (!this.isPlayerMoving && wasMoving) ||
                this.player.isJumping
            ) {
                this.stopMovementSound();
            }
        }
    }

    playerTakeDamage(damage) {
        if (this.isDead) return;

        this.consecutiveHits++;
        if (this.consecutiveHits >= 6) {
            // Her 6 vuruşta bir ses çal
            this.playPlayerHurtSound();
            this.consecutiveHits = 0;
        }

        this.playerHealth -= damage;
        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.isDead = true;
            this.gameRunning = false;
            this.reviveButton.style.display = "block";
        }
    }

    update() {
        // Update player hurt cooldown
        if (this.playerHurtCooldown > 0) {
            this.playerHurtCooldown--;
        }

        if (this.boat) {
            this.boat.update();
        }

        if (this.player) {
            // First update the player (apply physics, etc.)
            this.player.update();

            // Make sure movement sound is stopped when jumping
            if (this.player.isJumping && this.movementSoundPlaying) {
                this.stopMovementSound();
            }

            // Handle continuous attacks when mouse is held down
            if (this.isMouseDown && this.player.attack) {
                // Check if player is a Paladin and using smite
                const isPaladinUsingSmite =
                    this.player.constructor.name === "Paladin" &&
                    this.player.isUsingSmite;

                // Only allow attacks if not using smite
                if (!isPaladinUsingSmite) {
                    // Decrement cooldown
                    if (this.attackCooldown > 0) {
                        this.attackCooldown--;
                    } else if (
                        !this.player.isAttacking &&
                        !this.player.isJumping
                    ) {
                        // If cooldown is done and player is not already attacking or jumping
                        const attackResult = this.player.attack(
                            this.mouseX,
                            this.mouseY
                        );

                        if (attackResult.success) {
                            // Play attack sound
                            this.playAttackSound(attackResult.isRanged);

                            // Create projectile for ranged attacks
                            if (attackResult.isRanged) {
                                this.createProjectile(
                                    attackResult.angle,
                                    attackResult.attackType
                                );
                            }

                            // Reset cooldown
                            this.attackCooldown = this.attackCooldownMax;
                        }
                    }
                }
            }

            // IMPORTANT: Only adjust position if NOT jumping
            if (!this.player.isJumping) {
                // Set boundaries if needed
                if (this.boat && !this.playerBoundaries.set) {
                    this.adjustPlayerPosition();
                }
                // Adjust Y position with boat if floating
                else if (this.boat && this.boat.isFloating) {
                    // Get character type to set specific Y position
                    const characterType = this.player.constructor.name;
                    let yOffset = 0.8; // Default offset

                    // Set specific Y offsets for each character class
                    if (characterType === "Mage") {
                        yOffset = 1.08; // Raise the mage a bit higher on the boat
                    } else if (characterType === "Rogue") {
                        yOffset = 0.86; // Slightly adjust rogue position
                    } else if (characterType === "Paladin") {
                        yOffset = 0.82; // Keep paladin at the original position
                    }

                    this.player.y =
                        this.boat.y -
                        this.player.height +
                        this.boat.height * yOffset;
                    // Update initialY so jumps start from the right position
                    this.player.initialY = this.player.y;
                }
            }

            // Saldırı animasyonu başında flag'i resetle
            if (!this.player.isAttacking) {
                this.meleeImpactPlayedThisAttack = false;
            }

            // Update goblin ground positions to match player's bottom height
            for (const goblin of this.goblins) {
                goblin.updateGroundPosition(this.player);
            }
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

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update();

            // Remove inactive projectiles
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }

        // Check for wave completion
        if (this.isWaveInProgress && this.goblins.length === 0) {
            this.isWaveInProgress = false;
            this.wavesCleared++;

            if (this.currentWave < this.maxWaves) {
                this.currentWave++;
                setTimeout(() => {
                    this.spawnGoblinsForWave();
                }, 1500);
            }
        }

        // Update goblins
        let meleeHitSoundPlayed = false; // Track if we've played a melee hit sound this frame

        for (let i = this.goblins.length - 1; i >= 0; i--) {
            const goblin = this.goblins[i];
            goblin.update(this.player);

            if (goblin.shouldRemove) {
                this.goblins.splice(i, 1);
                continue;
            }

            // Check collision with projectiles only for alive goblins
            if (!goblin.isDead) {
                for (let j = this.projectiles.length - 1; j >= 0; j--) {
                    const projectile = this.projectiles[j];
                    if (
                        projectile.active &&
                        goblin.checkCollision(projectile)
                    ) {
                        // Goblin takes damage
                        goblin.takeDamage(1);
                        // Remove projectile
                        this.projectiles.splice(j, 1);
                    }
                }
            }

            // Check collision with player melee attacks
            if (
                this.player &&
                this.player.isAttacking &&
                !this.player.isRangedAttack &&
                goblin.health > 0
            ) {
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const goblinCenterX = goblin.x + goblin.width / 2;
                const goblinCenterY = goblin.y + goblin.height / 2;

                const distance = Math.sqrt(
                    Math.pow(playerCenterX - goblinCenterX, 2) +
                        Math.pow(playerCenterY - goblinCenterY, 2)
                );

                // Check if goblin is in melee range and hasn't been hit by this attack
                if (
                    distance <= 100 &&
                    !goblin.hitByCurrentAttack &&
                    this.player.isAttacking
                ) {
                    goblin.takeDamage(1);
                    goblin.hitByCurrentAttack = true;

                    // Sadece bir kez impact sesi çal
                    if (!this.meleeImpactPlayedThisAttack) {
                        this.playMeleeImpactSound();
                        this.meleeImpactPlayedThisAttack = true;
                    }

                    setTimeout(() => {
                        goblin.hitByCurrentAttack = false;
                    }, 400);
                }
            }

            // Check if player is using skill and damage nearby goblins
            if (
                this.player &&
                this.player.constructor.name === "Paladin" &&
                this.player.isUsingSmite &&
                this.player.currentAnimation === "smite_3"
            ) {
                if (
                    goblin.isInSkillRange(this.player, 200) &&
                    !goblin.hitByCurrentSkill &&
                    goblin.health > 0
                ) {
                    const smiteDamage = 1;
                    goblin.takeDamage(smiteDamage);
                    goblin.hitByCurrentSkill = true;

                    // Play random melee impact sound
                    const impactNumber = Math.floor(Math.random() * 3) + 1;
                    const impactSound = new Audio(
                        `assets/audio/melee_impact_0${impactNumber}.wav`
                    );
                    impactSound.volume = 0.7;
                    impactSound.play().catch(() => {
                        /* Silently handle error */
                    });

                    // Reset hitByCurrentSkill after a delay
                    setTimeout(() => {
                        goblin.hitByCurrentSkill = false;
                    }, 1500);
                }
            }

            // Check if goblin can attack player
            if (goblin.canAttackPlayer(this.player) && goblin.health > 0) {
                if (this.playerHurtCooldown <= 0) {
                    // Start goblin's attack animation if not already attacking
                    if (!goblin.isAttacking && goblin.canAttack) {
                        goblin.startAttack();
                    }

                    // Only deal damage during the attack animation's active frames
                    if (
                        goblin.isAttacking &&
                        goblin.attackTimer >
                            goblin.attackCooldown - goblin.attackDuration
                    ) {
                        this.playerTakeDamage(1);
                        this.playPlayerHurtSound();
                        this.playerHurtCooldown = this.playerHurtCooldownMax;
                    }
                }
            }
        }

        // Check wave completion
        this.checkWaveCompletion();
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

        // Render goblins
        for (const goblin of this.goblins) {
            goblin.render(this.ctx);
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

        // Render projectiles
        for (const projectile of this.projectiles) {
            projectile.render(this.ctx);
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
