class Boat {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = null;
        this.loaded = false;
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
                this.sprite = new Image();
                this.sprite.src = boatData.boat;
                console.log(`Boat image path set to: ${this.sprite.src}`);

                this.sprite.onload = () => {
                    console.log("Boat image loaded successfully");
                    this.loaded = true;
                };

                this.sprite.onerror = () => {
                    console.error(
                        "Failed to load boat image from path:",
                        this.sprite.src
                    );
                };
            }
        } catch (error) {
            console.error("Error loading boat image:", error);
        }
    }

    update() {}

    render(ctx) {
        if (!this.loaded || !this.sprite || !this.sprite.complete) {
            return;
        }

        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

export default Boat;
