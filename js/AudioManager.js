class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.2;
        this.sfxVolume = 0.7;
        this.debug = false;
        this.audioContext = null;

        try {
            window.AudioContext =
                window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {}
    }

    loadSound(key, path, isMusic = false) {
        return fetch(path, { method: "HEAD" })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Audio file not found: ${path}`);
                }

                if (!this.sounds[key]) {
                    const audio = new Audio();
                    audio.src = path;
                    audio.volume = isMusic ? this.musicVolume : this.sfxVolume;

                    this.sounds[key] = {
                        audio: audio,
                        isMusic: isMusic,
                    };

                    return new Promise((resolve, reject) => {
                        audio.addEventListener(
                            "canplaythrough",
                            () => {
                                resolve();
                            },
                            { once: true }
                        );

                        audio.addEventListener("error", (error) => {
                            reject(error);
                        });

                        audio.load();
                    });
                }

                return Promise.resolve();
            })
            .catch((error) => {
                throw error;
            });
    }

    play(key, loop = false) {
        const sound = this.sounds[key];
        if (sound) {
            sound.audio.loop = loop;
            sound.audio.currentTime = 0;

            if (this.audioContext && this.audioContext.state === "suspended") {
                this.audioContext.resume().catch(() => {});
            }

            sound.audio
                .play()
                .then(() => {})
                .catch((error) => {
                    if (
                        error.name === "NotSupportedError" ||
                        error.message.includes("not supported")
                    ) {
                        this.createFallbackAudioElement(
                            key,
                            sound.audio.src,
                            loop
                        );
                    } else {
                        this.createStartAudioButton(key);
                    }
                });
        }
    }

    createFallbackAudioElement(key, src, loop) {
        let fallbackElement = document.getElementById(`fallback-audio-${key}`);

        if (!fallbackElement) {
            fallbackElement = document.createElement("audio");
            fallbackElement.id = `fallback-audio-${key}`;
            fallbackElement.controls = true;
            fallbackElement.style.position = "absolute";
            fallbackElement.style.top = "10px";
            fallbackElement.style.right = "10px";
            fallbackElement.style.zIndex = "1000";

            const source = document.createElement("source");
            source.src = src;
            source.type = "audio/mpeg";

            fallbackElement.appendChild(source);
            document.body.appendChild(fallbackElement);
        }

        fallbackElement.loop = loop;
        fallbackElement.play().catch(() => {});
    }

    createStartAudioButton(key) {
        if (document.getElementById("start-audio-button")) {
            return;
        }

        const startButton = document.createElement("button");
        startButton.id = "start-audio-button";
        startButton.textContent = "Click to Start Music";
        startButton.style.position = "absolute";
        startButton.style.top = "10px";
        startButton.style.left = "10px";
        startButton.style.zIndex = "1000";
        startButton.style.padding = "10px";
        startButton.style.backgroundColor = "#4CAF50";
        startButton.style.color = "white";
        startButton.style.border = "none";
        startButton.style.borderRadius = "5px";
        startButton.style.cursor = "pointer";

        startButton.onclick = () => {
            const sound = this.sounds[key];
            if (sound) {
                sound.audio
                    .play()
                    .then(() => {
                        startButton.remove();
                    })
                    .catch(() => {
                        this.createFallbackAudioElement(
                            key,
                            sound.audio.src,
                            sound.audio.loop
                        );
                        startButton.remove();
                    });
            }
        };

        document.body.appendChild(startButton);
    }

    stop(key) {
        const sound = this.sounds[key];
        if (sound) {
            sound.audio.pause();
            sound.audio.currentTime = 0;
        }
    }

    pause(key) {
        const sound = this.sounds[key];
        if (sound) {
            sound.audio.pause();
        }
    }

    resume(key) {
        const sound = this.sounds[key];
        if (sound) {
            sound.audio.play().catch(() => {});
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        Object.values(this.sounds).forEach((sound) => {
            if (sound.isMusic) {
                sound.audio.volume = volume;
            }
        });
    }

    setSfxVolume(volume) {
        this.sfxVolume = volume;
        Object.values(this.sounds).forEach((sound) => {
            if (!sound.isMusic) {
                sound.audio.volume = volume;
            }
        });
    }
}

export default AudioManager;
