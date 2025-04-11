/**
 * Animation Cache Manager
 *
 * This file handles preloading and caching all game animations before gameplay starts.
 * Include this script before your main game code and call initCache() to start preloading.
 *
 * Cross-platform compatibility:
 * - Path normalization for Windows/Mac/Linux compatibility
 * - Consistent path separators across operating systems
 */

class AnimationCacheManager {
    constructor() {
        this.loadedImages = {};
        this.totalImages = 0;
        this.loadedCount = 0;
        this.isLoading = false;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;

        // Path normalization for cross-platform compatibility
        this.normalizedPaths = {};

        // Animation definitions
        this.animations = {
            ready: {
                frames: Array.from(
                    { length: 64 - 1 + 1 },
                    (_, i) => `assets/rogue/ready/${i + 1}.svg`
                ),
                loop: true,
            },
            walk_start: {
                frames: Array.from(
                    { length: 526 - 515 + 1 },
                    (_, i) => `assets/rogue/walk/start/${515 + i}.svg`
                ),
                loop: false,
            },
            walk_loop: {
                frames: Array.from(
                    { length: 550 - 527 + 1 },
                    (_, i) => `assets/rogue/walk/loop/${527 + i}.svg`
                ),
                loop: true,
            },
            walk_end: {
                frames: Array.from(
                    { length: 556 - 551 + 1 },
                    (_, i) => `assets/rogue/walk/end/${551 + i}.svg`
                ),
                loop: false,
            },
            run_start: {
                frames: Array.from(
                    { length: 566 - 559 + 1 },
                    (_, i) => `assets/rogue/run/start/${559 + i}.svg`
                ),
                loop: false,
            },
            run_loop: {
                frames: Array.from(
                    { length: 582 - 567 + 1 },
                    (_, i) => `assets/rogue/run/loop/${i + 567}.svg`
                ),
                loop: true,
            },
            run_end: {
                frames: Array.from(
                    { length: 595 - 583 + 1 },
                    (_, i) => `assets/rogue/run/end/${i + 583}.svg`
                ),
                loop: false,
            },
            melee_first: {
                frames: Array.from(
                    { length: 950 - 933 + 1 },
                    (_, i) => `assets/rogue/melee/first/${933 + i}.svg`
                ),
                loop: false,
            },
            melee_second: {
                frames: Array.from(
                    { length: 967 - 951 + 1 },
                    (_, i) => `assets/rogue/melee/second/${i + 951}.svg`
                ),
                loop: false,
            },
            melee_third: {
                frames: Array.from(
                    { length: 984 - 968 + 1 },
                    (_, i) => `assets/rogue/melee/third/${i + 968}.svg`
                ),
                loop: false,
            },
            skill_1: {
                frames: Array.from(
                    { length: 1175 - 1136 + 1 },
                    (_, i) => `assets/rogue/skills/saber_uber/${i + 1136}.svg`
                ),
                loop: false,
            },
            skill_2: {
                frames: Array.from(
                    { length: 1205 - 1176 + 1 },
                    (_, i) => `assets/rogue/skills/mace_uber/${i + 1176}.svg`
                ),
                loop: false,
            },
            jump_start: {
                frames: Array.from(
                    { length: 604 - 597 + 1 },
                    (_, i) => `assets/rogue/jump/start/${i + 597}.svg`
                ),
                loop: false,
            },
            jump_loop: {
                frames: Array.from(
                    { length: 628 - 605 + 1 },
                    (_, i) => `assets/rogue/jump/loop/${i + 605}.svg`
                ),
                loop: true,
            },
            jump_end: {
                frames: Array.from(
                    { length: 644 - 629 + 1 },
                    (_, i) => `assets/rogue/jump/end/${i + 629}.svg`
                ),
                loop: false,
            },
            fall_loop: {
                frames: Array.from(
                    { length: 669 - 646 + 1 },
                    (_, i) => `assets/rogue/fall/loop/${i + 646}.svg`
                ),
                loop: true,
            },
            fall_end: {
                frames: Array.from(
                    { length: 685 - 670 + 1 },
                    (_, i) => `assets/rogue/fall/end/${i + 670}.svg`
                ),
                loop: false,
            },
            // Shoot animations
            shoot_first: {
                frames: Array.from(
                    { length: 995 - 986 + 1 },
                    (_, i) => `assets/rogue/shoot/first/${i + 986}.svg`
                ),
                loop: false,
            },
            shoot_second: {
                frames: Array.from(
                    { length: 1007 - 998 + 1 },
                    (_, i) => `assets/rogue/shoot/second/${i + 998}.svg`
                ),
                loop: false,
            },
            shoot_up_45: {
                frames: Array.from(
                    { length: 1019 - 1010 + 1 },
                    (_, i) => `assets/rogue/shoot_up/45/${i + 1010}.svg`
                ),
                loop: false,
            },
            shoot_up_90: {
                frames: Array.from(
                    { length: 1031 - 1022 + 1 },
                    (_, i) => `assets/rogue/shoot_up/90/${i + 1022}.svg`
                ),
                loop: false,
            },
            shoot_down_45: {
                frames: Array.from(
                    { length: 1043 - 1034 + 1 },
                    (_, i) => `assets/rogue/shoot_down/45/${i + 1034}.svg`
                ),
                loop: false,
            },
            shoot_down_90: {
                frames: Array.from(
                    { length: 1055 - 1046 + 1 },
                    (_, i) => `assets/rogue/shoot_down/90/${i + 1046}.svg`
                ),
                loop: false,
            },
            throwing_blade_01: {
                frames: Array.from(
                    { length: 28 },
                    (_, i) =>
                        `assets/rogue/ranged/throwing_blade_01/${i + 1}.svg`
                ),
                loop: true,
            },
        };
    }

    /**
     * Normalize path for cross-platform compatibility
     * @param {string} path - The file path to normalize
     * @returns {string} - Normalized path with forward slashes
     */
    normalizePath(path) {
        if (!path) return path;
        // Replace all backslashes with forward slashes for consistency across platforms
        return path.replace(/\\/g, "/");
    }

    /**
     * Count total images to load
     */
    countTotalImages() {
        let count = 0;
        for (const animName in this.animations) {
            count += this.animations[animName].frames.length;
        }
        return count;
    }

    /**
     * Load a single image and add to cache
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            // Normalize the URL path for cross-platform compatibility
            const normalizedUrl = this.normalizePath(url);

            // Store the mapping between original and normalized URLs
            this.normalizedPaths[url] = normalizedUrl;

            // Skip if already loaded (check both original and normalized paths)
            if (this.loadedImages[normalizedUrl]) {
                resolve(this.loadedImages[normalizedUrl]);
                return;
            }
            if (this.loadedImages[url]) {
                resolve(this.loadedImages[url]);
                return;
            }

            const img = new Image();
            // Use normalized URL for loading
            img.src = normalizedUrl;

            img.onload = () => {
                // Store the image under both original and normalized URLs for compatibility
                this.loadedImages[normalizedUrl] = img;
                if (normalizedUrl !== url) {
                    this.loadedImages[url] = img;
                }
                this.loadedCount++;

                // Update global counter for debug panel
                window.loadedImagesCount = this.loadedCount;

                if (this.onProgressCallback) {
                    const progress =
                        (this.loadedCount / this.totalImages) * 100;
                    this.onProgressCallback(progress.toFixed(2), normalizedUrl);
                }

                resolve(img);
            };

            img.onerror = () => {
                console.error(
                    `Failed to load: ${normalizedUrl} (original: ${url})`
                );
                // Log more details about the error
                console.log("Image load error details:", {
                    normalizedUrl,
                    originalUrl: url,
                    loadedCount: this.loadedCount,
                    totalImages: this.totalImages,
                });
                this.loadedCount++;
                reject(url);
            };
        });
    }

    /**
     * Get a cached image or load it if not cached
     */
    getImage(url) {
        // Normalize the URL path for cross-platform compatibility
        const normalizedUrl = this.normalizePath(url);

        // Check if image is already loaded (check both original and normalized paths)
        if (this.loadedImages[normalizedUrl]) {
            return Promise.resolve(this.loadedImages[normalizedUrl]);
        }
        if (this.loadedImages[url]) {
            return Promise.resolve(this.loadedImages[url]);
        }

        // Load the image if not cached
        return this.loadImage(url);
    }

    /**
     * Initialize cache and start preloading
     */
    initCache(onProgress, onComplete) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.loadedCount = 0;
        this.onProgressCallback = onProgress;
        this.onCompleteCallback = onComplete;

        // Count total images
        this.totalImages = this.countTotalImages();
        console.log(`Starting preload of ${this.totalImages} images...`);

        // Create a loading overlay
        this.createLoadingOverlay();

        // Load all animations in parallel
        const loadPromises = [];

        for (const animName in this.animations) {
            this.animations[animName].frames.forEach((url) => {
                loadPromises.push(
                    this.loadImage(url).catch((err) =>
                        console.error("Failed to load:", err)
                    )
                );
            });
        }

        // When all images are loaded
        Promise.all(loadPromises)
            .then(() => {
                console.log("All animations loaded successfully!");
                this.isLoading = false;

                // Remove loading overlay
                this.removeLoadingOverlay();

                if (this.onCompleteCallback) {
                    this.onCompleteCallback(this.animations, this.loadedImages);
                }
            })
            .catch((error) => {
                console.error("Error during preload:", error);
                this.isLoading = false;
            });
    }

    /**
     * Create a loading overlay to show progress
     */
    createLoadingOverlay() {
        const overlay = document.createElement("div");
        overlay.id = "loading-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";

        const loadingText = document.createElement("h2");
        loadingText.id = "loading-text";
        loadingText.innerText = "Loading Game Assets...";
        loadingText.style.color = "white";
        loadingText.style.marginBottom = "20px";

        const progressContainer = document.createElement("div");
        progressContainer.style.width = "80%";
        progressContainer.style.maxWidth = "500px";
        progressContainer.style.height = "30px";
        progressContainer.style.backgroundColor = "#333";
        progressContainer.style.borderRadius = "5px";
        progressContainer.style.overflow = "hidden";

        const progressBar = document.createElement("div");
        progressBar.id = "progress-bar";
        progressBar.style.width = "0%";
        progressBar.style.height = "100%";
        progressBar.style.backgroundColor = "#4CAF50";
        progressBar.style.transition = "width 0.3s";

        const progressText = document.createElement("div");
        progressText.id = "progress-text";
        progressText.style.color = "white";
        progressText.style.marginTop = "10px";
        progressText.innerText = "0%";

        const currentFileText = document.createElement("div");
        currentFileText.id = "current-file";
        currentFileText.style.color = "#aaa";
        currentFileText.style.marginTop = "5px";
        currentFileText.style.fontSize = "12px";
        currentFileText.style.maxWidth = "80%";
        currentFileText.style.textOverflow = "ellipsis";
        currentFileText.style.overflow = "hidden";
        currentFileText.style.whiteSpace = "nowrap";

        progressContainer.appendChild(progressBar);
        overlay.appendChild(loadingText);
        overlay.appendChild(progressContainer);
        overlay.appendChild(progressText);
        overlay.appendChild(currentFileText);

        document.body.appendChild(overlay);
    }

    /**
     * Remove the loading overlay
     */
    removeLoadingOverlay() {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            // Fade out effect
            overlay.style.transition = "opacity 0.5s";
            overlay.style.opacity = "0";

            // Remove after animation completes
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }
    }

    /**
     * Update the loading progress display
     */
    updateProgress(percentage, currentFile) {
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");
        const currentFileText = document.getElementById("current-file");

        // Ensure the displayed file path uses normalized format
        const normalizedFile = this.normalizePath(currentFile);

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.innerText = `${percentage}%`;
        if (currentFileText) currentFileText.innerText = normalizedFile;
    }
}

// Export a singleton instance
const AnimationCache = new AnimationCacheManager();

// Make it available globally for debugging
window.AnimationCache = AnimationCache;

// Example of how to use in your game:
// AnimationCache.initCache(
//   (progress, file) => {
//     // Update progress UI
//     // The file path will be automatically normalized for cross-platform compatibility
//     AnimationCache.updateProgress(progress, file);
//   },
//   (animations, loadedImages) => {
//     // All animations loaded, start game
//     // loadedImages contains both original and normalized paths for cross-platform compatibility
//     startGame(animations, loadedImages);
//   }
// );
