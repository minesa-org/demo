class Boat {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.variantSettings = {
            player_ground: {
                scaleX: 1,
                scaleY: 0.9,
                offsetX: -0.1,
                offsetY: 0,
            },
            side_look: {
                scaleX: 1.2,
                scaleY: 1.12,
                offsetX: -0.12,
                offsetY: -0.09,
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
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load boat data from ${jsonPath}`);
            }

            const boatData = await response.json();

            if (boatData.boat) {
                if (boatData.boat.player_ground) {
                    this.sprites.player_ground = new Image();
                    this.sprites.player_ground.src =
                        boatData.boat.player_ground;

                    this.sprites.player_ground.onload = () => {
                        this.loaded.player_ground = true;
                    };
                }

                if (boatData.boat.side_look) {
                    this.sprites.side_look = new Image();
                    this.sprites.side_look.src = boatData.boat.side_look;

                    this.sprites.side_look.onload = () => {
                        this.loaded.side_look = true;
                    };
                }
            }
        } catch (error) {}
    }

    setVariant(variant) {
        if (this.sprites[variant] && this.loaded[variant]) {
            this.currentVariant = variant;
            return true;
        }
        return false;
    }

    update() {
        if (this.currentVariant === "side_look") {
            this.isFloating = true;
            this.floatTime += this.floatSpeed;
            this.y =
                this.originalY + Math.sin(this.floatTime) * this.floatAmplitude;
        } else if (this.currentVariant === "player_ground") {
            this.isFloating = false;
            this.velocityY += this.gravity;

            if (this.velocityY > this.terminalVelocity) {
                this.velocityY = this.terminalVelocity;
            }

            this.y += this.velocityY;

            const canvas = document.getElementById("gameCanvas");
            const groundLevel = canvas.height - this.height;

            if (this.y > groundLevel) {
                this.y = groundLevel;
                this.velocityY = 0;
            }
        }
    }

    render(ctx) {
        this.renderPlayerGround(ctx);
        this.renderSideLook(ctx);
    }
    renderPlayerGround(ctx) {
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
    }

    renderSideLook(ctx) {
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

    cycleVariant() {
        const variants = Object.keys(this.sprites).filter(
            (variant) => this.loaded[variant]
        );
        if (variants.length <= 1) return;

        const currentIndex = variants.indexOf(this.currentVariant);
        const nextIndex = (currentIndex + 1) % variants.length;
        this.currentVariant = variants[nextIndex];
    }
}

export default Boat;
