class AssetLoader {
    constructor() {
        this.imageCache = new Map();
        this.audioCache = new Map();
        this.jsonCache = new Map();
        this.loadPromises = new Map();
    }

    async loadImage(path) {
        // Return cached image if available
        if (this.imageCache.has(path)) {
            return this.imageCache.get(path);
        }

        // Return existing promise if already loading
        if (this.loadPromises.has(path)) {
            return this.loadPromises.get(path);
        }

        // Create new loading promise
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(path, img);
                this.loadPromises.delete(path);
                resolve(img);
            };
            img.onerror = () => {
                this.loadPromises.delete(path);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });

        this.loadPromises.set(path, promise);
        return promise;
    }

    async loadJson(path) {
        if (this.jsonCache.has(path)) {
            return this.jsonCache.get(path);
        }

        if (this.loadPromises.has(path)) {
            return this.loadPromises.get(path);
        }

        const promise = fetch(path)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load JSON from ${path}`);
                }
                return response.json();
            })
            .then((data) => {
                this.jsonCache.set(path, data);
                this.loadPromises.delete(path);
                return data;
            });

        this.loadPromises.set(path, promise);
        return promise;
    }

    async loadAudio(path, options = { volume: 0.7 }) {
        if (this.audioCache.has(path)) {
            const audio = new Audio();
            audio.src = this.audioCache.get(path).src;
            audio.volume = options.volume;
            return audio;
        }

        if (this.loadPromises.has(path)) {
            return this.loadPromises.get(path);
        }

        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.audioCache.set(path, audio);
                this.loadPromises.delete(path);
                resolve(audio);
            };
            audio.onerror = () => {
                this.loadPromises.delete(path);
                reject(new Error(`Failed to load audio: ${path}`));
            };
            audio.volume = options.volume;
            audio.src = path;
            audio.load();
        });

        this.loadPromises.set(path, promise);
        return promise;
    }

    clearCache() {
        this.imageCache.clear();
        this.audioCache.clear();
        this.jsonCache.clear();
        this.loadPromises.clear();
    }
}

export default AssetLoader;
