import Player from "./Player.js";

class Paladin extends Player {
    constructor(x, y) {
        const width = 319.83;
        const height = 364.85;
        const frameDelay = 2;
        super(x, y, width, height, frameDelay);

        this.characterFolder = "Paladin";
        this.jsonPath = "assets/player/paladin.json";

        // Set effective width to 95.95 for all characters
        this.effectiveWidthRatio = this.calculateEffectiveWidthRatio(95.95);
        this.effectiveWidthOffset = 0.1;

        // Set effective height ratio for better attack detection
        this.effectiveHeightRatio = 0.3;

        // Add smite skill properties
        this.isUsingSmite = false;
        this.smiteCooldown = 0;
        this.smiteMaxCooldown = 120; // 2 seconds at 60 FPS

        // Add basic attack cooldown property - SPECIFIC TO PALADIN
        this.basicAttackCooldownMax = 40; // Set to a higher value (e.g., 40, 50) for slower basic attacks. Original was effectively 20 frames.

        this.loadAnimations(this.jsonPath, this.characterFolder);
    }
    moveLeft() {
        super.moveLeft();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveRight() {
        super.moveRight();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveUp() {
        super.moveUp();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    moveDown() {
        super.moveDown();
        if (this.currentAnimation === "ready") {
            this.setAnimation("run", this.characterFolder);
        }
    }

    stopX() {
        super.stopX();
    }

    stopY() {
        super.stopY();
    }

    jump() {
        // Reset smite state if active
        if (this.isUsingSmite) {
            this.isUsingSmite = false;
        }

        super.jump();
        if (this.currentAnimation === "ready") {
            this.setAnimation("jump", this.characterFolder);
        }
    }

    meleeAttack() {
        // Don't allow melee attacks while smite is active
        if (this.isUsingSmite) {
            console.log("Smite active, cannot basic attack.");
            return { success: false, isRanged: false }; // Indicate failure
        }

        // Call the parent method to handle the basic attack logic
        // Return the result to indicate whether the attack was started
        return super.meleeAttack();
    }

    // Method to update cooldowns
    update() {
        // Call the parent update method
        super.update();

        // Update smite cooldown
        if (this.smiteCooldown > 0) {
            this.smiteCooldown--;

            // Debug cooldown
            if (this.smiteCooldown === 0) {
                // Reset isUsingSmite flag when cooldown ends
                // This ensures the skill can be used again
                this.isUsingSmite = false;
                +console.log("Smite cooldown finished.");
            }
        }
    }

    // Method to use the smite skill
    useSmite() {
        // Don't allow using smite while jumping, attacking, or on cooldown
        if (this.isJumping || this.isAttacking || this.smiteCooldown > 0) {
            +console.log(
                "Cannot use Smite: jumping, attacking, or on cooldown."
            );
            return false;
        }

        // Set smite flag - this will prevent basic attacks
        this.isUsingSmite = true;

        try {
            // Set animation to smite_3
            const smiteAnimPath = "smite_3";

            // Verify the animation exists before setting it
            let anim = this.animations[smiteAnimPath];

            if (!anim || !anim.start || !anim.start[0] || !anim.start[1]) {
                // If animation doesn't exist or is invalid, reset to ready state
                this.isUsingSmite = false;
                +console.error(
                    "Smite animation sequence 'start' is invalid or missing."
                );
                return false;
            }

            // Start the smite animation - use the start sequence
            this.currentAnimation = smiteAnimPath;
            this.state = "starting";
            this.loadAnimationSequence("start");

            // Reset animation counters
            this.currentFrameIndex = 0;
            this.frameCount = 0;

            // Set cooldown - 120 frames (2 seconds)
            this.smiteCooldown = 60; // Note: The comment says 120, but the code sets 60. Let's use 60 for now.

            +console.log("Smite skill used.");
            return true; // Return true to indicate skill was successfully used
        } catch (e) {
            // If any error occurs, reset to ready state
            this.isUsingSmite = false;
            +console.error("Error using Smite skill:", e);
            return false;
        }
    }

    // Override updateAnimationFrame to handle smite animation
    updateAnimationFrame() {
        if (this.currentFrames.length === 0) return;

        this.currentFrameIndex++;

        if (this.currentFrameIndex >= this.currentFrames.length) {
            // If we're at the end of the smite animation sequence
            if (this.currentAnimation === "smite_3") {
                if (this.state === "starting") {
                    // Transition from start to loop
                    this.state = "looping";
                    this.loadAnimationSequence("loop");
                    this.currentFrameIndex = 0;
                    +console.log("Smite animation: starting -> looping");
                } else if (this.state === "looping") {
                    // Check if loop sequence has a valid end frame
                    const anim = this.animations["smite_3"];
                    if (anim && anim.end && anim.end[0] && anim.end[1]) {
                        // Transition from loop to end
                        this.state = "ending";
                        this.loadAnimationSequence("end");
                        this.currentFrameIndex = 0;
                        +console.log("Smite animation: looping -> ending");
                    } else {
                        // No valid end sequence, go directly to ready
                        // Clear the isUsingSmite flag to allow basic attacks again
                        this.isUsingSmite = false;
                        this.state = "looping"; // Still keep state as looping as we just exit
                        this.currentAnimation = "ready"; // Go back to ready animation
                        this.loadAnimationSequence("loop"); // Load ready loop animation
                        this.currentFrameIndex = 0;
                        +console.log(
                            "Smite animation: looping -> ready (no end sequence)"
                        );
                    }
                } else if (this.state === "ending") {
                    // Transition from end to ready
                    // Clear the isUsingSmite flag to allow basic attacks again
                    this.isUsingSmite = false;
                    this.state = "looping"; // Still keep state as looping as we just exit
                    this.currentAnimation = "ready"; // Go back to ready animation
                    this.loadAnimationSequence("loop"); // Load ready loop animation
                    this.currentFrameIndex = 0;
                    +console.log("Smite animation: ending -> ready");
                }
            } else {
                // For other animations, use the parent method
                super.updateAnimationFrame();
            }
        }
    }
}

export default Paladin;
