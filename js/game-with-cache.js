/**
 * Main Game with Animation Caching
 *
 * This file contains the main game logic and uses the AnimationCacheManager
 * to handle efficient loading and caching of animations.
 */

// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state variables
let currentAnim = "ready";
let frame = 0;
let direction = -1; // -1 is facing right, 1 is facing left
let position = canvas.width / 2;
let speed = 5;
let runSpeed = 10;
let isMovingLeft = false;
let isMovingRight = false;

// Audio variables
let backgroundMusic;
let isMusicMuted = false;
let isRunning = true; // Default is running
let isWalking = false; // Alt/Option key for walking
let isAttacking = false;
let currentAttack = 0; // 0: first, 1: second, 2: third
let isUsingSkill = false;
let currentSkill = 0; // 0: skill1, 1: skill2
let isJumping = false; // For jump animation
let isFalling = false; // For fall animation
let jumpHeight = 0; // Current jump height
let jumpVelocity = 0; // Current jump velocity
let gravity = 0.5; // Gravity force
let maxJumpHeight = 100; // Maximum jump height

// Mouse and throwing variables
let mouseX = 0;
let mouseY = 0;
let isThrowing = false;
let throwAngle = 0; // Angle for directional throwing
let throwDirection = 0; // 0: straight, 1: 45 degrees up, 2: 90 degrees up, 3: 45 degrees down, 4: 90 degrees down
let shootCount = 0; // Track shoot count to alternate between first and second
let activeProjectiles = []; // Array to store active throwing blades
let isMouseDown = false; // Track if mouse button is being held down
let attackInterval = null; // Interval for continuous attacks
let attackDelay = 300; // Delay between continuous attacks (milliseconds)
let lastThrowTime = 0; // Last time a throwing blade was thrown
let throwCooldown = 500; // Cooldown between throws (0.5 seconds)
let isAnimationCompleted = true;
let comboTimeoutId = null;
const comboResetTime = 1000; // 1 second to reset combo

// Store loaded animations and images
let animations = {};
let loadedImages = {};
let backgroundImage = null; // Background image

// Audio elements
let footstepsSound;
let meleeSound1;
let meleeSound2;
let meleeSound3;
let skill1Sound;
let skill1VoxSound;
let throwSound;
let jumpSound;
let isFootstepsPlaying = false;
let footstepsSoundDuration = 0; // Will store the duration of the footsteps sound

// Game initialization function
function initGame(cachedAnimations, cachedImages) {
    // Store the cached animations and images
    animations = cachedAnimations;
    loadedImages = cachedImages;

    // Setup event listeners
    setupEventListeners();

    // Load background image
    loadBackgroundImage();

    // Initialize audio elements
    initAudio();

    // Display controls info
    displayControlsInfo();

    // Start game loop
    requestAnimationFrame(optimizedGameLoop);

    console.log("Game initialized with cached animations!");
}

// Load background image
function loadBackgroundImage() {
    backgroundImage = new Image();
    backgroundImage.src = "assets/others/background.png";
    backgroundImage.onload = function () {
        console.log("Background image loaded");
    };
}

// Function to play background music
function playBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.play().catch((error) => {
            console.log("Background music couldn't autoplay: ", error);
            // We'll add a UI element to let the user start the music manually
        });
    }
}

// Function to toggle music mute state
function toggleMusicMute() {
    if (backgroundMusic) {
        isMusicMuted = !isMusicMuted;
        backgroundMusic.muted = isMusicMuted;

        // Update the music indicator if it exists
        if (window.updateMusicIndicator) {
            window.updateMusicIndicator();
        }
    }
}

// Initialize audio elements
function initAudio() {
    footstepsSound = document.getElementById("footsteps");
    meleeSound1 = document.getElementById("melee1");
    meleeSound2 = document.getElementById("melee2");
    meleeSound3 = document.getElementById("melee3");
    skill1Sound = document.getElementById("skill1");
    skill1VoxSound = document.getElementById("skill1Vox");
    throwSound = document.getElementById("throwSound");
    jumpSound = document.getElementById("jumpSound");
    backgroundMusic = document.getElementById("backgroundMusic");

    // Set up audio properties
    footstepsSound.volume = 0.7;
    backgroundMusic.volume = 0.5; // Set background music volume

    // Play background music
    playBackgroundMusic();

    // Instead of using the built-in loop property, we'll handle looping manually
    // to avoid the gap between loops
    footstepsSound.loop = false;

    // Store the duration for manual looping
    footstepsSound.addEventListener("loadedmetadata", function () {
        footstepsSoundDuration = footstepsSound.duration * 1000; // Convert to milliseconds
        // Footsteps sound duration stored for internal use
    });

    // Create a second footsteps sound element for seamless looping
    const footstepsSound2 = document.createElement("audio");
    footstepsSound2.src = footstepsSound.src;
    footstepsSound2.volume = footstepsSound.volume;
    footstepsSound2.load();

    // Set up variable for dual-audio seamless looping
    let activeFootstep = footstepsSound;

    // Set up event listener to handle truly seamless looping with dual audio elements
    footstepsSound.addEventListener("timeupdate", function () {
        // When we're 200ms from the end (or 20% of total duration, whichever is smaller),
        // start the next sound to create perfect overlap
        const overlapTime = Math.min(0.2, footstepsSound.duration * 0.2);
        if (
            activeFootstep === footstepsSound &&
            footstepsSound.currentTime >
                footstepsSound.duration - overlapTime &&
            !footstepsSound2.currentTime
        ) {
            // Start the second sound
            footstepsSound2.currentTime = 0;
            footstepsSound2.play();
            // Switch active sound
            activeFootstep = footstepsSound2;
            // Next footstep is now the first one
        }
    });

    // Same for the second sound
    footstepsSound2.addEventListener("timeupdate", function () {
        const overlapTime = Math.min(0.2, footstepsSound2.duration * 0.2);
        if (
            activeFootstep === footstepsSound2 &&
            footstepsSound2.currentTime >
                footstepsSound2.duration - overlapTime &&
            !footstepsSound.currentTime
        ) {
            // Start the first sound
            footstepsSound.currentTime = 0;
            footstepsSound.play();
            // Switch active sound
            activeFootstep = footstepsSound;
            // Next footstep is now the second one
        }
    });

    // Function to reset both footstep sounds
    window.resetFootstepSounds = function () {
        footstepsSound.pause();
        footstepsSound2.pause();
        footstepsSound.currentTime = 0;
        footstepsSound2.currentTime = 0.5;
        activeFootstep = footstepsSound;
        // Reset to first footstep as active
    };

    meleeSound1.volume = 0.4;
    meleeSound2.volume = 0.4;
    meleeSound3.volume = 0.4;

    skill1Sound.volume = 0.3;
    skill1VoxSound.volume = 0.7;

    throwSound.volume = 0.5;
    jumpSound.volume = 0.6;

    // Attempt to preload sounds for immediate playback
    preloadSounds();

    console.log("Audio initialized!");
}

// Preload all sounds to ensure immediate playback
function preloadSounds() {
    // Create an array of all sound elements
    const allSounds = [
        footstepsSound,
        meleeSound1,
        meleeSound2,
        meleeSound3,
        skill1Sound,
        skill1VoxSound,
        throwSound,
        jumpSound,
    ];

    // Force preload by playing and immediately pausing
    allSounds.forEach((sound) => {
        // Set volume to 0 to avoid any audible sound
        const originalVolume = sound.volume;
        sound.volume = 0;
        sound
            .play()
            .then(() => {
                sound.pause();
                sound.currentTime = 0;
                sound.volume = originalVolume;
            })
            .catch(() => {
                // Ignore errors - they're likely due to user interaction requirements
                sound.volume = originalVolume;
            });
    });
}

// Play a random melee attack sound
function playMeleeSound() {
    // Create an array of melee sounds
    const meleeSounds = [meleeSound1, meleeSound2, meleeSound3];

    // Randomly select one of the three melee sounds
    const randomIndex = Math.floor(Math.random() * meleeSounds.length);
    const selectedSound = meleeSounds[randomIndex];

    // Clone the audio node for immediate playback without interruption
    const soundClone = selectedSound.cloneNode();
    soundClone.volume = selectedSound.volume;
    soundClone.play();

    // Clean up the clone after it finishes playing
    soundClone.onended = function () {
        soundClone.remove();
    };
}

// Play skill 1 sound effects
function playSkill1Sound() {
    // Clone the sounds for immediate playback without interruption
    const soundClone = skill1Sound.cloneNode();
    const voxClone = skill1VoxSound.cloneNode();

    // Set volumes
    soundClone.volume = skill1Sound.volume;
    voxClone.volume = skill1VoxSound.volume;

    // Play both immediately
    soundClone.play();
    voxClone.play();

    // Clean up the clones after they finish playing
    soundClone.onended = function () {
        soundClone.remove();
    };
    voxClone.onended = function () {
        voxClone.remove();
    };
}

// Play throw sound effect
function playThrowSound() {
    // Clone the sound for immediate playback without interruption
    const soundClone = throwSound.cloneNode();
    soundClone.volume = throwSound.volume;
    soundClone.play();

    // Clean up the clone after it finishes playing
    soundClone.onended = function () {
        soundClone.remove();
    };
}

// Play jump sound effect
function playJumpSound() {
    // Clone the sound for immediate playback without interruption
    const soundClone = jumpSound.cloneNode();
    soundClone.volume = jumpSound.volume;
    soundClone.play();

    // Clean up the clone after it finishes playing
    soundClone.onended = function () {
        soundClone.remove();
    };
}

// Play or stop footsteps sound
function updateFootstepsSound() {
    // Play footsteps when moving
    if ((isMovingLeft || isMovingRight) && !isJumping && !isFalling) {
        if (!isFootstepsPlaying) {
            // Start with the first footstep sound
            footstepsSound.currentTime = 0;
            footstepsSound.play();
            isFootstepsPlaying = true;
        }
    } else {
        // Stop footsteps when not moving
        if (isFootstepsPlaying) {
            // Use our global reset function to stop both sounds
            window.resetFootstepSounds();
            isFootstepsPlaying = false;
        }
    }
}

// Setup event listeners for keyboard and mouse input
function setupEventListeners() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Add mouse event listeners
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    // Prevent context menu on right-click
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}

// Handle key press events
function handleKeyDown(e) {
    // Key down event handled

    switch (e.key.toLowerCase()) {
        case "a":
            isMovingLeft = true;
            direction = 1; // Left-facing
            if (!isAttacking && !isUsingSkill) {
                if (isWalking) {
                    if (
                        currentAnim === "ready" ||
                        currentAnim === "relaxed" ||
                        currentAnim === "run_loop" ||
                        currentAnim === "run_end"
                    ) {
                        changeAnimation("walk_start");
                    }
                } else {
                    // Default is running
                    if (currentAnim === "run_loop") {
                        // Already running, don't restart animation
                        // Do nothing to keep the current animation
                    } else if (
                        currentAnim === "ready" ||
                        currentAnim === "relaxed" ||
                        currentAnim === "walk_loop" ||
                        currentAnim === "walk_end"
                    ) {
                        changeAnimation("run_start");
                    } else if (currentAnim === "run_end") {
                        // If we're ending a run and the player presses a movement key again,
                        // go directly to run_loop to avoid restarting the animation
                        changeAnimation("run_loop");
                    }
                }
            }
            break;

        case "d":
            isMovingRight = true;
            direction = -1; // Right-facing
            if (!isAttacking && !isUsingSkill) {
                if (isWalking) {
                    if (
                        currentAnim === "ready" ||
                        currentAnim === "relaxed" ||
                        currentAnim === "run_loop" ||
                        currentAnim === "run_end"
                    ) {
                        changeAnimation("walk_start");
                    }
                } else {
                    // Default is running
                    if (currentAnim === "run_loop") {
                        // Already running, don't restart animation
                        // Do nothing to keep the current animation
                    } else if (
                        currentAnim === "ready" ||
                        currentAnim === "relaxed" ||
                        currentAnim === "walk_loop" ||
                        currentAnim === "walk_end"
                    ) {
                        changeAnimation("run_start");
                    } else if (currentAnim === "run_end") {
                        // If we're ending a run and the player presses a movement key again,
                        // go directly to run_loop to avoid restarting the animation
                        changeAnimation("run_loop");
                    }
                }
            }
            break;

        case "control":
        case "ctrl":
        case "controlleft":
        case "controlright":
            isWalking = true;
            isRunning = false;
            if (
                !isAttacking &&
                !isUsingSkill &&
                (isMovingLeft || isMovingRight)
            ) {
                if (currentAnim === "run_loop" || currentAnim === "run_start") {
                    changeAnimation("walk_start");
                }
            }
            break;

        // Removed J key for melee attack, now using mouse click

        case "1":
            useSkill(0); // First skill
            break;

        case "2":
            useSkill(1); // Second skill
            break;

        case "w":
            performJump();
            break;
    }
}

// Handle key release events
function handleKeyUp(e) {
    // Key up event handled

    switch (e.key.toLowerCase()) {
        case "a":
            isMovingLeft = false;
            checkMovementTransition();
            break;

        case "d":
            isMovingRight = false;
            checkMovementTransition();
            break;

        case "control":
        case "ctrl":
        case "controlleft":
        case "controlright":
            isWalking = false;
            isRunning = true;
            if (
                !isAttacking &&
                !isUsingSkill &&
                (isMovingLeft || isMovingRight)
            ) {
                if (
                    currentAnim === "walk_loop" ||
                    currentAnim === "walk_start"
                ) {
                    changeAnimation("run_start");
                }
            }
            break;

        case "m":
            // Toggle music mute state
            toggleMusicMute();
            break;
    }
}

// Check and handle movement transitions
function checkMovementTransition() {
    if (!isMovingLeft && !isMovingRight && !isAttacking && !isUsingSkill) {
        if (currentAnim === "walk_loop" || currentAnim === "walk_start") {
            changeAnimation("walk_end");
        } else if (currentAnim === "run_loop" || currentAnim === "run_start") {
            changeAnimation("run_end");
        }
    }
}

// Perform melee attack with combo system
function performMeleeAttack() {
    // Allow attacks while jumping or falling
    if (isAttacking || isUsingSkill) return;

    isAttacking = true;

    // Play melee attack sound
    playMeleeSound();

    // Progress through combo sequence
    const meleeAnimations = ["melee_first", "melee_second", "melee_third"];
    changeAnimation(meleeAnimations[currentAttack]);

    // Move to next combo if there's time remaining
    currentAttack = (currentAttack + 1) % 3;

    // Reset combo timeout
    if (comboTimeoutId) {
        clearTimeout(comboTimeoutId);
    }
}

// Perform jump
function performJump() {
    // Don't allow jumping if already jumping, falling, or using a skill
    // Now allowing jumping while attacking
    if (isJumping || isFalling || isUsingSkill) return;

    isJumping = true;
    jumpVelocity = 10; // Initial upward velocity
    jumpHeight = 0;

    // Start jump animation
    changeAnimation("jump_start");

    // Play jump sound
    playJumpSound();
}

// Use a skill
function useSkill(skillNum) {
    if (isAttacking || isUsingSkill || isJumping || isFalling) return;

    isUsingSkill = true;
    currentSkill = skillNum;
    changeAnimation(`skill_${skillNum + 1}`);

    // Play skill sound based on skill number
    if (skillNum === 0) {
        // First skill (index 0)
        playSkill1Sound();
    }
}

// Change current animation
function changeAnimation(newAnim) {
    if (currentAnim === newAnim) return;

    currentAnim = newAnim;
    frame = 0;
    isAnimationCompleted = false;
}

// Update animation frame
function nextFrame() {
    const animation = animations[currentAnim];
    frame++;

    if (frame >= animation.frames.length) {
        isAnimationCompleted = true;

        if (animation.loop) {
            frame = 0;
        } else {
            frame = animation.frames.length - 1;

            // Handle animation transitions based on current state
            if (currentAnim === "walk_start") {
                if (isMovingLeft || isMovingRight) {
                    changeAnimation("walk_loop");
                } else {
                    changeAnimation("walk_end");
                }
            } else if (currentAnim === "walk_end") {
                changeAnimation("ready");
            } else if (currentAnim === "run_start") {
                if (!isWalking && (isMovingLeft || isMovingRight)) {
                    changeAnimation("run_loop");
                } else {
                    changeAnimation("run_end");
                }
            } else if (currentAnim === "run_end") {
                if (isMovingLeft || isMovingRight) {
                    if (isWalking) {
                        changeAnimation("walk_loop");
                    } else {
                        changeAnimation("run_loop");
                    }
                } else {
                    changeAnimation("ready");
                }
            } else if (currentAnim.startsWith("melee_")) {
                isAttacking = false;

                // Reset combo after a delay if there's no follow-up attack
                if (comboTimeoutId) {
                    clearTimeout(comboTimeoutId);
                }
                comboTimeoutId = setTimeout(() => {
                    currentAttack = 0;
                }, comboResetTime);

                // Return to appropriate animation based on current state
                if (isJumping) {
                    // If we're jumping, return to jump animation
                    changeAnimation("jump_loop");
                } else if (isFalling) {
                    // If we're falling, return to fall animation
                    changeAnimation("fall_loop");
                } else if (isMovingLeft || isMovingRight) {
                    // If we're moving, return to appropriate movement animation
                    if (isWalking) {
                        changeAnimation("walk_loop");
                    } else {
                        changeAnimation("run_loop");
                    }
                } else {
                    // Otherwise, return to ready stance
                    changeAnimation("ready");
                }
            } else if (currentAnim.startsWith("skill_")) {
                isUsingSkill = false;

                // Return to appropriate animation based on current state
                if (isJumping) {
                    // If we're jumping, return to jump animation
                    changeAnimation("jump_loop");
                } else if (isFalling) {
                    // If we're falling, return to fall animation
                    changeAnimation("fall_loop");
                } else if (isMovingLeft || isMovingRight) {
                    // If we're moving, return to appropriate movement animation
                    if (isWalking) {
                        changeAnimation("walk_loop");
                    } else {
                        changeAnimation("run_loop");
                    }
                } else {
                    // Otherwise, return to ready stance
                    changeAnimation("ready");
                }
            } else if (currentAnim === "jump_start") {
                // Transition from jump start to jump loop
                changeAnimation("jump_loop");
            } else if (currentAnim === "fall_end") {
                // Transition from fall end to appropriate movement or idle animation
                if (isAttacking) {
                    // If we're attacking, don't change the animation
                    // The attack animation will handle the transition
                } else if (isThrowing) {
                    // If we're throwing, don't change the animation
                    // The throw animation will handle the transition
                } else if (isMovingLeft || isMovingRight) {
                    // If we're moving, return to appropriate movement animation
                    if (isWalking) {
                        changeAnimation("walk_loop");
                    } else {
                        changeAnimation("run_loop");
                    }
                } else {
                    // Otherwise, return to ready stance
                    changeAnimation("ready");
                }
            } else if (
                currentAnim === "shoot_first" ||
                currentAnim === "shoot_second" ||
                currentAnim === "shoot_up_45" ||
                currentAnim === "shoot_up_90" ||
                currentAnim === "shoot_down_45" ||
                currentAnim === "shoot_down_90"
            ) {
                // End of throwing animation
                isThrowing = false;

                // Return to appropriate animation based on current state
                if (isJumping) {
                    // If we're jumping, return to jump animation
                    changeAnimation("jump_loop");
                } else if (isFalling) {
                    // If we're falling, return to fall animation
                    changeAnimation("fall_loop");
                } else if (isMovingLeft || isMovingRight) {
                    // If we're moving, return to appropriate movement animation
                    if (isWalking) {
                        changeAnimation("walk_loop");
                    } else {
                        changeAnimation("run_loop");
                    }
                } else {
                    // Otherwise, return to ready stance
                    changeAnimation("ready");
                }
            }
        }
    }
}

// Update character position
function updatePosition() {
    const currentSpeed = isRunning ? runSpeed : speed;

    // Handle horizontal movement
    if (isMovingLeft) {
        position -= currentSpeed;
    } else if (isMovingRight) {
        position += currentSpeed;
    }

    // Handle jumping and falling
    if (isJumping || isFalling) {
        // Apply gravity to velocity
        jumpVelocity -= gravity;

        // Update jump height
        jumpHeight += jumpVelocity;

        // Check if we've reached the peak of the jump
        if (isJumping && jumpVelocity <= 0) {
            isJumping = false;
            isFalling = true;

            // Only change animation if not attacking or throwing
            if (!isAttacking && !isThrowing) {
                changeAnimation("fall_loop");
            }
        }

        // Check if we've landed
        if (isFalling && jumpHeight <= 0) {
            jumpHeight = 0;
            isFalling = false;

            // Only change animation if not attacking or throwing
            if (!isAttacking && !isThrowing) {
                changeAnimation("fall_end");
            }
        }
    }

    // Keep character within canvas bounds
    // Since position is now the center of the character, we need to account for half the character width
    const characterHalfWidth = 50; // Approximate half width of character
    position = Math.max(
        characterHalfWidth,
        Math.min(position, canvas.width - characterHalfWidth)
    );
}

// Draw the current frame
function drawFrame() {
    if (!animations[currentAnim]) {
        console.error("Invalid animation:", currentAnim);
        return;
    }

    const frameUrl = animations[currentAnim].frames[frame];
    if (!frameUrl) {
        console.error("Invalid frame:", frame, "for animation:", currentAnim);
        return;
    }

    const img = loadedImages[frameUrl];
    if (!img) {
        console.error("Image not found in cache:", frameUrl);
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Draw background image if loaded
    if (backgroundImage && backgroundImage.complete) {
        // Draw the background image with slight zoom (130%) and centered
        const scale = 1.3; // 130% zoom
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;

        // Calculate offsets to center the zoomed image
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2 - 80; // Shift up by 80px to show more ground

        // Draw the zoomed background image
        ctx.drawImage(
            backgroundImage,
            offsetX,
            offsetY,
            scaledWidth,
            scaledHeight
        );
    }

    // Debug text removed

    // Position is the center of the character
    const characterCenterX = position;

    // No debug text displayed

    // Render projectiles
    renderProjectiles(ctx);

    // Calculate vertical position based on jump height
    // Ensure character is properly grounded when not jumping or falling
    // Add a ground offset to position the character on the ground
    const groundLevel = canvas.height - 450; // Position character higher on the ground
    const verticalOffset =
        (isJumping || isFalling) && jumpHeight > 0
            ? groundLevel - jumpHeight
            : groundLevel;

    // Draw character with proper direction
    // Use the characterCenterX as the actual center of the character
    // Calculate the top-left corner for drawing
    const drawX = characterCenterX - img.width / 2;

    // Save context for character drawing
    ctx.save();

    if (direction === 1) {
        // Flip horizontally for left-facing
        // First clear any previous transformations
        ctx.restore();
        ctx.save();

        // Translate to the center point, then scale, then draw centered
        ctx.translate(characterCenterX, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
            img,
            -img.width / 2,
            verticalOffset,
            img.width,
            img.height
        );
    } else {
        // Draw normally for right-facing
        ctx.drawImage(img, drawX, verticalOffset, img.width, img.height);
    }
    ctx.restore();
}

// Main game loop
let lastFrameTime = 0;
const frameDelay = 30; // 30ms for animation speed

function optimizedGameLoop(timestamp) {
    if (timestamp - lastFrameTime >= frameDelay) {
        lastFrameTime = timestamp;
        updatePosition();
        updateProjectiles(); // Update projectiles before drawing
        updateFootstepsSound(); // Update footsteps sound based on movement
        drawFrame();
        nextFrame();
    }
    requestAnimationFrame(optimizedGameLoop);
}

// Display controls info on screen
function displayControlsInfo() {
    // Create controls info div
    const infoDiv = document.createElement("div");
    infoDiv.style.position = "absolute";
    infoDiv.style.bottom = "10px";
    infoDiv.style.left = "10px";
    infoDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
    infoDiv.style.color = "white";
    infoDiv.style.padding = "10px";
    infoDiv.style.fontFamily = "Arial, sans-serif";
    infoDiv.style.fontSize = "14px";
    infoDiv.style.borderRadius = "5px";

    // Create music indicator
    const musicIndicator = document.createElement("div");
    musicIndicator.id = "musicIndicator";
    musicIndicator.style.position = "absolute";
    musicIndicator.style.top = "10px";
    musicIndicator.style.right = "10px";
    musicIndicator.style.backgroundColor = "rgba(0,0,0,0.7)";
    musicIndicator.style.color = "white";
    musicIndicator.style.padding = "10px";
    musicIndicator.style.fontFamily = "Arial, sans-serif";
    musicIndicator.style.fontSize = "14px";
    musicIndicator.style.borderRadius = "5px";
    musicIndicator.style.cursor = "pointer";
    musicIndicator.innerHTML = "🔊 Music On";

    // Add click event to toggle music
    musicIndicator.addEventListener("click", function () {
        toggleMusicMute();
        // The toggleMusicMute function will call window.updateMusicIndicator
    });

    // Function to update music indicator text
    window.updateMusicIndicator = function () {
        if (isMusicMuted) {
            musicIndicator.innerHTML = "🔇 Music Off";
        } else {
            musicIndicator.innerHTML = "🔊 Music On";
        }
    };

    infoDiv.innerHTML = `
      <strong>Controls:</strong><br>
      A/D - Move left/right (run by default)<br>
      Control - Hold to walk<br>
      W - Jump<br>
      Left Click - Attack (melee when close, throw when far)<br>
      1 - Skill 1<br>
      2 - Skill 2<br>
      M - Toggle music mute
  `;

    document.body.appendChild(infoDiv);
    document.body.appendChild(musicIndicator);
}

// Track mouse position
function handleMouseMove(e) {
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Character direction is now only updated when throwing or attacking
    // Not in real-time with mouse movement
}

// Handle mouse down for continuous attacks
function handleMouseDown(e) {
    // Only handle left mouse button (button 0)
    if (e.button !== 0) return;

    isMouseDown = true;

    // Perform initial attack
    performAttack();

    // Set up interval for continuous attacks
    if (attackInterval) clearInterval(attackInterval);
    attackInterval = setInterval(performAttack, attackDelay);
}

// Handle mouse up to stop continuous attacks
function handleMouseUp(e) {
    // Only handle left mouse button (button 0)
    if (e.button !== 0) return;

    isMouseDown = false;

    // Clear attack interval
    if (attackInterval) {
        clearInterval(attackInterval);
        attackInterval = null;
    }
}

// Perform attack based on mouse position
function performAttack() {
    // Don't attack if already attacking or using skill
    // Now allowing attacks while jumping or falling
    if (isAttacking || isUsingSkill) return;

    // Update character direction based on mouse position
    if (mouseX < position) {
        direction = 1; // Face left
    } else {
        direction = -1; // Face right
    }

    // Calculate distance from character to mouse
    const characterCenterX = position; // Position is now the center of the character
    const characterCenterY = canvas.height / 2; // Approximate character center
    const distanceX = mouseX - characterCenterX;
    const distanceY = mouseY - characterCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If mouse is close to character, perform melee attack
    if (distance < 100) {
        performMeleeAttack();
    } else {
        // Otherwise, perform throwing attack
        performThrow(distanceX, distanceY);
    }
}

// Perform throwing attack
function performThrow(distanceX, distanceY) {
    // Allow throwing while jumping or falling
    if (isAttacking || isUsingSkill || isThrowing) return;

    // Check if throw is on cooldown
    const currentTime = Date.now();
    if (currentTime - lastThrowTime < throwCooldown) {
        // Still on cooldown, don't throw
        return;
    }

    // Update last throw time
    lastThrowTime = currentTime;

    // Throw cooldown applied

    isThrowing = true;

    // Play throw sound
    playThrowSound();

    // Calculate throw angle
    throwAngle = Math.atan2(distanceY, distanceX);

    // We'll determine the throw direction based on the relative position of the mouse

    // Determine throw direction and animation based on angle
    if (distanceY < -Math.abs(distanceX * 0.5)) {
        // Throwing upward
        if (distanceY < -Math.abs(distanceX)) {
            // 90 degrees up
            throwDirection = 2;
            changeAnimation("shoot_up_90");
        } else {
            // 45 degrees up
            throwDirection = 1;
            changeAnimation("shoot_up_45");
        }
    } else if (distanceY > Math.abs(distanceX * 0.5)) {
        // Throwing downward
        if (distanceY > Math.abs(distanceX)) {
            // 90 degrees down
            throwDirection = 4;
            changeAnimation("shoot_down_90");
        } else {
            // 45 degrees down
            throwDirection = 3;
            changeAnimation("shoot_down_45");
        }
    } else {
        // Straight throw (horizontal)
        throwDirection = 0;

        // Alternate between first and second shoot animations
        if (shootCount % 2 === 0) {
            changeAnimation("shoot_first");
        } else {
            changeAnimation("shoot_second");
        }
        shootCount++;
    }

    // Create a new projectile
    // Adjust position based on character direction and animation
    let handOffsetX = 0;
    let handOffsetY = 0;

    // Adjust hand position based on throw direction
    if (throwDirection === 0) {
        // Horizontal
        handOffsetX = direction === -1 ? 30 : -30; // Right or left side
        handOffsetY = 50; // Much lower position
    } else if (throwDirection === 1 || throwDirection === 2) {
        // Up
        handOffsetX = direction === -1 ? 25 : -25; // Slightly to the side
        handOffsetY = 30; // Still lower for upward throws
    } else {
        // Down
        handOffsetX = direction === -1 ? 25 : -25; // Slightly to the side
        handOffsetY = 70; // Much lower for downward throws
    }

    // Apply vertical offset for jumping/falling
    // Ensure character is properly grounded when not jumping or falling
    const groundLevel = canvas.height - 450; // Match the character ground level
    const verticalStateOffset =
        (isJumping || isFalling) && jumpHeight > 0
            ? groundLevel - jumpHeight
            : groundLevel;

    const characterCenterX = position + handOffsetX; // Center of character + hand offset
    const characterCenterY = verticalStateOffset + 200 + handOffsetY; // Position projectile 200 pixels lower

    const projectile = {
        x: characterCenterX, // Start from center of character
        y: characterCenterY, // Start from hand height
        angle: throwAngle,
        speed: 15,
        frame: 0,
        active: true,
        size: 0.25, // Scale factor for blade size (25% of original size to match hand size)
    };

    activeProjectiles.push(projectile);
}

// Update and render projectiles
function updateProjectiles() {
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const projectile = activeProjectiles[i];

        // Update position
        projectile.x += Math.cos(projectile.angle) * projectile.speed;
        projectile.y += Math.sin(projectile.angle) * projectile.speed;

        // Update animation frame
        projectile.frame =
            (projectile.frame + 1) % animations.throwing_blade_01.frames.length;

        // Remove projectile if it goes off screen
        if (
            projectile.x < -50 ||
            projectile.x > canvas.width + 50 ||
            projectile.y < -50 ||
            projectile.y > canvas.height + 50
        ) {
            activeProjectiles.splice(i, 1);
        }
    }
}

// Render projectiles
function renderProjectiles(ctx) {
    activeProjectiles.forEach((projectile) => {
        const frameUrl = animations.throwing_blade_01.frames[projectile.frame];
        const img = loadedImages[frameUrl];

        if (img) {
            ctx.save();
            ctx.translate(projectile.x, projectile.y);
            ctx.rotate(projectile.angle + Math.PI / 2); // Adjust rotation to match throw direction
            // Draw the throwing blade at hand size (using projectile.size)
            const width = img.width * projectile.size;
            const height = img.height * projectile.size;

            ctx.drawImage(
                img,
                -width / 2, // Center the blade
                -height / 2, // Center the blade
                width, // Scaled width
                height // Scaled height
            );
            ctx.restore();
        }
    });
}

// Start the game when animations are loaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Animation Cache with callbacks
    AnimationCache.initCache(
        (progress, file) => {
            // Update loading progress UI
            AnimationCache.updateProgress(progress, file);
        },
        (animations, loadedImages) => {
            // All animations loaded, start the game
            initGame(animations, loadedImages);
        }
    );
});
