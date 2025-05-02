class Boat {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Configurable settings for each boat variant
        this.variantSettings = {
            player_ground: {
                scaleX: 1, // Width scale factor
                scaleY: 0.9, // Height scale factor
                offsetX: -0.1, // Horizontal position offset (as a factor of width)
                offsetY: 0, // Vertical position offset (as a factor of height)
            },
            side_look: {
                scaleX: 1.2, // Width scale factor
                scaleY: 1.12, // Height scale factor
                offsetX: -0.12, // Horizontal position offset (as a factor of width)
                offsetY: -0.09, // Vertical position offset (as a factor of height)
            },
        };

        this.sprites = {
            player_ground: null,
            side_look: null,
        };
        this.currentVariant = "side_look";
        this.loaded = {
            player_ground: false,
            side_look: false,
        };

        this.velocityY = 0;
        this.gravity = 0.2;
        this.terminalVelocity = 5;
        this.isFloating = true;
        this.floatAmplitude = 5;
        this.floatSpeed = 0.02;
        this.floatTime = 0;

        this.originalY = y;
    }

    async loadImage(jsonPath) {
        try {
            console.log(`Loading boat data from ${jsonPath}`);
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load boat data from ${jsonPath}`);
            }

            const boatData = await response.json();
            console.log("Boat data loaded:", boatData);

            if (boatData.boat) {
                // Load player ground boat
                if (boatData.boat.player_ground) {
                    this.sprites.player_ground = new Image();
                    this.sprites.player_ground.src =
                        boatData.boat.player_ground;
                    console.log(
                        `Player ground boat image path set to: ${this.sprites.player_ground.src}`
                    );

                    this.sprites.player_ground.onload = () => {
                        console.log(
                            "Player ground boat image loaded successfully"
                        );
                        this.loaded.player_ground = true;
                    };

                    this.sprites.player_ground.onerror = () => {
                        console.error(
                            "Failed to load player ground boat image from path:",
                            this.sprites.player_ground.src
                        );
                    };
                }

                // Load side look boat
                if (boatData.boat.side_look) {
                    this.sprites.side_look = new Image();
                    this.sprites.side_look.src = boatData.boat.side_look;
                    console.log(
                        `Side look boat image path set to: ${this.sprites.side_look.src}`
                    );

                    this.sprites.side_look.onload = () => {
                        console.log("Side look boat image loaded successfully");
                        this.loaded.side_look = true;
                    };

                    this.sprites.side_look.onerror = () => {
                        console.error(
                            "Failed to load side look boat image from path:",
                            this.sprites.side_look.src
                        );
                    };
                }
            }
        } catch (error) {
            console.error("Error loading boat images:", error);
        }
    }

    setVariant(variant) {
        if (this.sprites[variant] && this.loaded[variant]) {
            this.currentVariant = variant;
            return true;
        }
        console.warn(
            `Boat variant '${variant}' not available or not loaded yet.`
        );
        return false;
    }

    update() {
        // Apply different physics based on the boat variant
        if (this.currentVariant === "side_look") {
            // Floating motion for side_look variant
            this.isFloating = true;
            this.floatTime += this.floatSpeed;
            // Use sine wave for smooth up and down motion
            this.y =
                this.originalY + Math.sin(this.floatTime) * this.floatAmplitude;
        } else if (this.currentVariant === "player_ground") {
            // Gravity for player_ground variant
            this.isFloating = false;

            // Apply gravity
            this.velocityY += this.gravity;

            // Limit falling speed
            if (this.velocityY > this.terminalVelocity) {
                this.velocityY = this.terminalVelocity;
            }

            // Update position
            this.y += this.velocityY;

            // Check if boat has reached the bottom of the screen
            const canvas = document.getElementById("gameCanvas");
            const groundLevel = canvas.height - this.height; // Position boat at bottom of screen

            if (this.y > groundLevel) {
                this.y = groundLevel;
                this.velocityY = 0;
            }
        }
    }

    render(ctx) {
        // Render player_ground variant
        if (
            this.loaded.player_ground &&
            this.sprites.player_ground &&
            this.sprites.player_ground.complete
        ) {
            const settings = this.variantSettings.player_ground;
            const variantWidth = this.width * settings.scaleX;
            const variantHeight = this.height * settings.scaleY;
            const variantX = this.x + this.width * settings.offsetX;
            const variantY = this.y + this.height * settings.offsetY;

            ctx.drawImage(
                this.sprites.player_ground,
                variantX,
                variantY,
                variantWidth,
                variantHeight
            );
        }

        // Render side_look variant
        if (
            this.loaded.side_look &&
            this.sprites.side_look &&
            this.sprites.side_look.complete
        ) {
            const settings = this.variantSettings.side_look;
            const variantWidth = this.width * settings.scaleX;
            const variantHeight = this.height * settings.scaleY;
            const variantX = this.x + this.width * settings.offsetX;
            const variantY = this.y + this.height * settings.offsetY;

            ctx.drawImage(
                this.sprites.side_look,
                variantX,
                variantY,
                variantWidth,
                variantHeight
            );
        }
    }

    // Method to cycle through available boat variants
    cycleVariant() {
        const variants = Object.keys(this.sprites).filter(
            (variant) => this.loaded[variant]
        );
        if (variants.length <= 1) return;

        const currentIndex = variants.indexOf(this.currentVariant);
        const nextIndex = (currentIndex + 1) % variants.length;
        this.currentVariant = variants[nextIndex];
        console.log(`Switched to boat variant: ${this.currentVariant}`);
    }
}

export default Boat;
