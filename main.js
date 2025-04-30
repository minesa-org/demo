import Game from "./js/Game.js";

async function main() {
    console.log("Starting game initialization");
    const game = new Game();

    // Initialize the game
    game.init();
    console.log("Game initialized");

    // Create the player (using paladin character)
    game.createPlayer("paladin");
    console.log("Player created");

    // Start the game loop
    game.start();
    console.log("Game started");
}

main();
